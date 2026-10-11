import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'portraits')
const UA = 'PraviteliSchool/1.0 (educational static archive; local classroom use)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const items = [
  ['rurik.jpg', 'Рюрик'],
  ['oleg.jpg', 'Олег_Вещий'],
  ['igor.jpg', 'Игорь_Рюрикович'],
  ['olga.jpg', 'Ольга_(княгиня_киевская)'],
  ['svyatoslav.jpg', 'Святослав_Игоревич'],
  ['vladimir.jpg', 'Владимир_Святославич'],
  ['yaroslav.jpg', 'Ярослав_Владимирович_Мудрый'],
  ['monomakh.jpg', 'Владимир_Всеволодович_Мономах'],
  ['dolgoruky.jpg', 'Юрий_Долгорукий'],
  ['bogolyubsky.jpg', 'Андрей_Боголюбский'],
  ['vsevolod.jpg', 'Всеволод_Большое_Гнездо'],
  ['nevsky.jpg', 'Александр_Ярославич_Невский'],
  ['kalita.jpg', 'Иван_I_Калита'],
  ['donskoy.jpg', 'Дмитрий_Донской'],
  ['ivan-iii.jpg', 'Иван_III_Васильевич'],
  ['vasily-iii.jpg', 'Василий_III'],
  ['ivan-iv.jpg', 'Иван_Грозный'],
  ['fyodor-i.jpg', 'Фёдор_I_Иоаннович'],
  ['godunov.jpg', 'Борис_Годунов'],
  ['false-dmitry.jpg', 'Лжедмитрий_I'],
  ['shuisky.jpg', 'Василий_IV_Шуйский'],
  ['mikhail.jpg', 'Михаил_Фёдорович'],
  ['alexei.jpg', 'Алексей_Михайлович'],
  ['sophia.jpg', 'Софья_Алексеевна'],
  ['peter-i.jpg', 'Пётр_I'],
  ['catherine-i.jpg', 'Екатерина_I'],
  ['anna.jpg', 'Анна_Иоанновна'],
  ['elizabeth.jpg', 'Елизавета_Петровна'],
  ['peter-iii.jpg', 'Пётр_III'],
  ['catherine-ii.jpg', 'Екатерина_II'],
  ['paul.jpg', 'Павел_I'],
  ['alexander-i.jpg', 'Александр_I'],
  ['nicholas-i.jpg', 'Николай_I'],
  ['alexander-ii.jpg', 'Александр_II'],
  ['alexander-iii.jpg', 'Александр_III'],
  ['nicholas-ii.jpg', 'Николай_II'],
  ['lvov.jpg', 'Львов,_Георгий_Евгеньевич'],
  ['kerensky.jpg', 'Керенский,_Александр_Фёдорович'],
  ['lenin.jpg', 'Ленин,_Владимир_Ильич'],
  ['stalin.jpg', 'Сталин,_Иосиф_Виссарионович'],
  ['malenkov.jpg', 'Маленков,_Георгий_Максимилианович'],
  ['khrushchev.jpg', 'Хрущёв,_Никита_Сергеевич'],
  ['brezhnev.jpg', 'Брежнев,_Леонид_Ильич'],
  ['andropov.jpg', 'Андропов,_Юрий_Владимирович'],
  ['chernenko.jpg', 'Черненко,_Константин_Устинович'],
  ['gorbachev.jpg', 'Горбачёв,_Михаил_Сергеевич'],
  ['yeltsin.jpg', 'Ельцин,_Борис_Николаевич'],
  ['putin.jpg', 'Путин,_Владимир_Владимирович'],
  ['medvedev.jpg', 'Медведев,_Дмитрий_Анатольевич'],
  ['svyatopolk.jpg', 'Святополк_Окаянный'],
  ['izyaslav-i.jpg', 'Изяслав_Ярославич'],
  ['vsevolod-i.jpg', 'Всеволод_Ярославич'],
  ['mstislav.jpg', 'Мстислав_Великий'],
  ['yuri-ii.jpg', 'Юрий_Всеволодович'],
  ['yaroslav-ii.jpg', 'Ярослав_Всеволодович_(великий_князь_владимирский)'],
  ['yuri-danilovich.jpg', 'Юрий_Данилович'],
  ['mikhail-tver.jpg', 'Михаил_Ярославич'],
  ['semyon-gordy.jpg', 'Семён_Гордый'],
  ['alexis.jpg', 'Алексий_(Бяконт)'],
  ['vasily-i.jpg', 'Василий_I_Дмитриевич'],
  ['sophia-vitovtovna.jpg', 'Софья_Витовтовна'],
  ['vasily-ii.jpg', 'Василий_II_Тёмный'],
  ['elena-glinskaya.jpg', 'Елена_Глинская'],
  ['vladislav-iv.jpg', 'Владислав_IV'],
  ['fyodor-iii.jpg', 'Фёдор_III_Алексеевич'],
  ['peter-ii.jpg', 'Пётр_II'],
  ['ivan-vi.jpg', 'Иван_VI'],
  ['konstantin-pavlovich.jpg', 'Константин_Павлович'],
]

await mkdir(dir, { recursive: true })

for (const [file, title] of items) {
  const dest = join(dir, file)
  try {
    await access(dest)
    continue
  } catch {
    /* missing */
  }
  await sleep(1200)
  const url = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (!res.ok) {
      console.log('FAIL summary', file, res.status, title)
      continue
    }
    const data = await res.json()
    const src = data.originalimage?.source || data.thumbnail?.source
    if (!src) {
      console.log('NO IMAGE', file, title)
      continue
    }
    await sleep(400)
    const img = await fetch(src, { headers: { 'User-Agent': UA } })
    if (!img.ok) {
      console.log('FAIL image', file, img.status)
      continue
    }
    const buf = Buffer.from(await img.arrayBuffer())
    await writeFile(dest, buf)
    console.log('OK', file, buf.length)
  } catch (e) {
    console.log('ERR', file, e.message)
  }
}
