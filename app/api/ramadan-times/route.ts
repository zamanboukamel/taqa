// Auto-fill prayer times for the director's academy across the 7-day Ramadan
// window. Fetches from Aladhan and persists into ramadan_days (source 'api').
// Manual edits are saved separately from the client (source 'manual').
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRamadanTimes } from "@/lib/ramadan/times";
import { todayISO, windowDates, weekdayOf } from "@/lib/ramadan/schedule";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      academyId?: string;
      startDate?: string;
    };
    if (!body.academyId) {
      return NextResponse.json({ error: "Missing academyId." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    // RLS ensures this only resolves an academy the director owns.
    const { data: academy } = await supabase
      .from("academies")
      .select("*")
      .eq("id", body.academyId)
      .maybeSingle();
    if (!academy) {
      return NextResponse.json({ error: "Academy not found." }, { status: 404 });
    }

    const start =
      body.startDate || academy.ramadan_start_date || todayISO(new Date());
    const dates = windowDates(start);

    const results = await Promise.all(
      dates.map(async (day_date) => {
        const times = await fetchRamadanTimes(
          academy.city,
          academy.country,
          day_date,
        );
        return {
          day_date,
          weekday: weekdayOf(day_date),
          suhoor: times?.suhoor ?? null,
          iftar: times?.iftar ?? null,
        };
      }),
    );

    const rows = results
      .filter((r) => r.suhoor && r.iftar)
      .map((r) => ({
        academy_id: academy.id,
        day_date: r.day_date,
        suhoor_time: r.suhoor as string,
        iftar_time: r.iftar as string,
        source: "api",
      }));

    if (rows.length) {
      const { error } = await supabase
        .from("ramadan_days")
        .upsert(rows, { onConflict: "academy_id,day_date" });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ times: results, start });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}
