
// pages/index.jsx
import React from 'react'

const CITIES = [
  { name: 'Rabat', q: 'Rabat,MA' },
  { name: 'Casablanca', q: 'Casablanca,MA' },
  { name: 'Marrakesh', q: 'Marrakesh,MA' },
]

const API_KEY = 'cbf0bf8b9762d0c25b600d9ee832174d' // مفتاحك الشخصي

async function fetchCityWeather(q) {
  const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${API_KEY}`)
  const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&units=metric&appid=${API_KEY}`)
  if (!currentRes.ok || !forecastRes.ok) throw new Error(`Failed to fetch data for ${q}`)
  const current = await currentRes.json()
  const forecastData = await forecastRes.json()

  const daily = []
  const seenDates = new Set()
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000)
    const dayKey = date.toISOString().split('T')[0]
    if (!seenDates.has(dayKey) && date.getHours() === 12) {
      seenDates.add(dayKey)
      daily.push({
        date,
        temp_min: Math.round(item.main.temp_min),
        temp_max: Math.round(item.main.temp_max),
        desc: item.weather?.[0]?.description || '',
        icon: item.weather?.[0]?.icon
      })
    }
  })

  return { current, daily: daily.slice(0,5) }
}

export async function getServerSideProps() {
  try {
    const promises = CITIES.map(c => fetchCityWeather(c.q))
    const results = await Promise.all(promises)
    const data = results.map((r, i) => ({ city: CITIES[i].name, ...r }))
    return { props: { data } }
  } catch (err) {
    return { props: { error: err.message } }
  }
}

export default function Home({ data, error }) {
  const weekDays = ['الأحد / Sunday','الاثنين / Monday','الثلاثاء / Tuesday','الأربعاء / Wednesday','الخميس / Thursday','الجمعة / Friday','السبت / Saturday']

  return (
    <div className="min-h-screen bg-blue-50 text-slate-900 p-6">
      <header className="max-w-4xl mx-auto mb-6">
        <h1 className="text-3xl font-semibold text-blue-900">weather.ma — مثال مبدئي</h1>
        <p className="text-sm text-blue-700 mt-1">الطقس الحالي وتوقعات 5 أيام لمدن مغربية (Rabat, Casablanca, Marrakesh)</p>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6 md:grid-cols-1">
        {error && (
          <div className="col-span-full p-4 bg-red-50 border border-red-200 rounded">{error}</div>
        )}

        {data?.map((item) => {
          const r = item.current
          const temp = Math.round(r.main.temp)
          const feels = Math.round(r.main.feels_like)
          const desc = r.weather?.[0]?.description || ''
          const icon = r.weather?.[0]?.icon
          const wind = r.wind?.speed

          return (
            <article key={item.city} className="p-4 bg-white rounded shadow">
              <h2 className="font-medium text-lg text-blue-900">{item.city}</h2>
              <div className="mt-3 flex items-center gap-3">
                {icon && <img src={`https://openweathermap.org/img/wn/${icon}@2x.png`} alt={desc} width={64} height={64} />}
                <div>
                  <div className="text-3xl font-bold">{temp}°C</div>
                  <div className="text-sm text-blue-700">{desc} — يشعر كأنها {feels}°C</div>
                  <div className="text-sm text-blue-500 mt-1">الرياح: {wind ?? '-'} m/s</div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 overflow-x-auto">
                {item.daily.map((d, idx) => (
                  <div key={idx} className="flex-none w-20 p-2 bg-blue-100 rounded text-center">
                    <div className="text-xs text-blue-800 font-medium">{weekDays[d.date.getDay()]}</div>
                    {d.icon && <img src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`} alt={d.desc} width={48} height={48} className="mx-auto" />}
                    <div className="text-sm text-blue-900 font-semibold">{d.temp_max}° / {d.temp_min}°</div>
                    <div className="text-xs text-blue-700 capitalize">{d.desc}</div>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </main>

      <footer className="max-w-4xl mx-auto mt-8 text-xs text-blue-500">
        <p>مصدر البيانات: OpenWeatherMap API. رمز المشروع مبدئي معد للاختبار والتوسع لاحقًا.</p>
      </footer>
    </div>
  )
}
