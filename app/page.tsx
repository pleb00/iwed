"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, CalendarDays, Check, Heart, Home, Mail, MapPin, BookOpen, Copy, Flower2 } from "lucide-react";
import data from "@/data/wedding.json";

function Botanical({ className = "" }: { className?: string }) {
  return <svg className={`botanical ${className}`} viewBox="0 0 300 480" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.1"><path d="M151 470C111 358 211 242 143 28M148 427C84 384 60 318 44 266M151 364C224 326 241 270 255 217M153 290C92 258 75 199 75 147M164 220C203 180 214 129 214 91M155 150C116 118 109 78 111 48"/>{[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${i%2?165:93} ${55+i*58}) rotate(${i%2?30:-45})`}><path d="M0 40C-28 13-21-17 0-35C21-17 28 13 0 40Z"/><path d="M0 39V-31M0 13L-12-3M0 0L11-14"/></g>)}<path d="M44 266C9 255 5 223 17 198C43 204 55 232 44 266ZM255 217C240 186 254 160 280 151C291 180 280 205 255 217ZM75 147C41 136 37 109 48 86C72 93 87 119 75 147ZM214 91C200 64 208 39 231 27C244 51 235 78 214 91ZM143 28C126 12 137-5 151-15C165 3 159 21 143 28Z"/></g></svg>;
}

const dateText = (value: string) => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: data.timeZone }).format(new Date(value));
const timeText = (value: string) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: data.timeZone }).format(new Date(value));
const names = `${data.couple.bride.name} & ${data.couple.groom.name}`;

export default function Invitation() {
  const [guest, setGuest] = useState(data.guest);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [active, setActive] = useState("home");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    setGuest(new URLSearchParams(window.location.search).get("kpd")?.trim() || data.guest);
    const update = () => setRemaining(Math.max(0, new Date(data.date).getTime() - Date.now()));
    update(); const timer = setInterval(update, 1000);
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); }); }, { rootMargin: "-20% 0px -55% 0px" });
    document.querySelectorAll("section[id]").forEach(section => observer.observe(section));
    return () => { clearInterval(timer); observer.disconnect(); };
  }, []);
  const countdown = remaining === null ? ["—", "—", "—", "—"] : [Math.floor(remaining/86400000), Math.floor(remaining/3600000)%24, Math.floor(remaining/60000)%60, Math.floor(remaining/1000)%60].map(n => String(n).padStart(2, "0"));
  const calendar = () => {
    const escape = (s:string) => s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
    const utc = (s:string) => new Date(s).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//iwed//Wedding Invitation//ID", ...data.events.flatMap((event,index) => ["BEGIN:VEVENT", `UID:iwed-${utc(event.start)}-${index}@invitation.local`, `DTSTAMP:${utc(new Date().toISOString())}`, `DTSTART:${utc(event.start)}`, `DTEND:${utc(event.end)}`, `SUMMARY:${escape(`${event.name} — ${names}`)}`, `LOCATION:${escape(`${data.venue.name}, ${data.venue.address}`)}`, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], {type:"text/calendar;charset=utf-8"})); const a = document.createElement("a"); a.href=url; a.download="wedding.ics"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const copyAddress = async () => { try { await navigator.clipboard.writeText(data.venue.address); setCopied(true); setCopyError(false); setTimeout(()=>setCopied(false),2500); } catch { setCopyError(true); } };
  return <>
    <a className="skip-link" href="#couple">Lewati ke undangan</a>
    <header className="topbar"><a className="monogram" href="#home">{data.couple.bride.name[0]}<span>&</span>{data.couple.groom.name[0]}<i>THE WEDDING</i></a><nav aria-label="Navigasi utama"><a href="#couple">Mempelai</a><a href="#events">Acara</a><a href="#story">Our Story</a><a className="nav-location" href="#location">Lokasi <ArrowUpRight size={13}/></a></nav></header>
    <main>
      <section id="home" className="hero"><div className="hero-inner"><div className="hero-copy"><span className="eyebrow"><span className="small-line"/>{data.copy.eyebrow}</span><h1>{data.couple.bride.name}<span className="amp">&</span>{data.couple.groom.name}</h1><p className="tagline">{data.copy.tagline}</p><div className="hero-date"><span/>{dateText(data.date)}<span/></div><p className="invitation-copy">{data.copy.invitation}</p><div className="guest"><span>Kepada Yth.</span><strong>{guest}</strong></div><a className="button" href="#couple"><Mail size={16}/> Buka Undangan <ArrowDown size={15}/></a></div><div className="hero-art"><div className="arch-border"/><div className="arch"><Botanical className="branch-left"/><Botanical className="branch-right"/><div className="arch-content"><span>TOGETHER IS A<br/>BEAUTIFUL PLACE TO BE</span><div className="art-monogram">{data.couple.bride.name[0]}<em>&</em>{data.couple.groom.name[0]}</div><div className="art-rule"/><p>the beginning of forever</p><span className="art-date">{new Intl.DateTimeFormat("en-GB", {day:"2-digit",month:"2-digit",year:"numeric",timeZone:data.timeZone}).format(new Date(data.date)).replaceAll("/"," . ")}</span></div></div><div className="seal"><Heart size={20} strokeWidth={1}/><span>WITH LOVE</span></div><span className="art-caption">A NEW CHAPTER, WRITTEN TOGETHER</span></div></div><a className="scroll-hint" href="#couple">SCROLL TO DISCOVER <ArrowDown size={13}/></a></section>
      <div className="quote-band"><Flower2 size={27} strokeWidth={1}/><blockquote>“{data.copy.quote}”</blockquote><span>{data.copy.quoteSource}</span></div>
      <section id="couple" className="section couple-section"><span className="eyebrow">DENGAN CINTA & DOA RESTU</span><h2>Meet the happy couple</h2><p className="greeting">{data.copy.greeting}</p><p className="section-intro">{data.copy.intro}</p><div className="couple-grid">{[data.couple.bride,data.couple.groom].map((person,index)=><article className="person" key={person.name}><div className="portrait"><Botanical/><span>{person.name[0]}</span><small>{index===0?"THE BRIDE":"THE GROOM"}</small></div><h3>{person.fullName}</h3><p>{person.familyLabel}</p><p className="parents">{person.father}<br/>& {person.mother}</p></article>)}<span className="couple-amp">&</span></div></section>
      <section id="events" className="section events-section"><span className="eyebrow">A DAY TO REMEMBER</span><h2>Save the date</h2><p className="section-intro">Satu hari istimewa. Kenangan untuk selamanya.</p><div className="countdown" aria-label="Hitung mundur pernikahan">{countdown.map((n,i)=><div key={i}><strong>{n}</strong><span>{["HARI","JAM","MENIT","DETIK"][i]}</span></div>)}</div>{remaining===0&&<p>Hari bahagia telah tiba. Terima kasih atas doa Anda.</p>}<div className="event-grid">{data.events.map((event,i)=><article className="event-card" key={event.name}><span className="event-icon">{i===0?<Heart size={25} strokeWidth={1}/>:<Flower2 size={27} strokeWidth={1}/>}</span><h3>{event.name}</h3><p>{dateText(event.start)}</p><strong>{timeText(event.start)} – {timeText(event.end)} {data.timeZoneLabel}</strong><div className="divider"/><h4>{data.venue.name}</h4><p>{data.venue.room}</p><p className="event-note">{event.description}</p></article>)}</div><button className="button outline" onClick={calendar}><CalendarDays size={16}/> Simpan ke Kalender <ArrowUpRight size={14}/></button></section>
      <section id="story" className="section story-section"><div className="story-heading"><span className="eyebrow">EVERY LOVE HAS A STORY</span><h2>This is ours.</h2><p>Langkah kecil yang membawa kami<br/>menuju satu tujuan: bersama.</p><Botanical/></div><div className="timeline">{data.story.map(item=><article key={item.year}><span className="year">{item.year}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>
      <section id="location" className="section location-section"><span className="eyebrow">MEET US HERE</span><h2>A beautiful place to begin</h2><div className="venue-grid"><div className="venue-copy"><MapPin size={26} strokeWidth={1}/><h3>{data.venue.name}</h3><p className="room">{data.venue.room}</p><p>{data.venue.address}</p><a className="button" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.venue.mapQuery)}`}>Buka Google Maps <ArrowUpRight size={16}/></a><button className="copy-button" onClick={copyAddress}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?"Alamat tersalin":"Salin alamat"}</button><small role="status">{copyError?`Silakan salin alamat secara manual: ${data.venue.address}`:data.venue.note}</small></div><iframe title={`Peta lokasi ${data.venue.name}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(data.venue.mapQuery)}&z=14&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div></section>
      <footer><Flower2 size={30} strokeWidth={1}/><p>{data.copy.closing}</p><h2>{names}</h2><span>{data.copy.footer}</span><a href="#home">Kembali ke atas ↑</a></footer>
    </main>
    <nav className="mobile-nav" aria-label="Navigasi bagian">{[{id:"home",label:"Beranda",Icon:Home},{id:"couple",label:"Mempelai",Icon:Heart},{id:"events",label:"Acara",Icon:CalendarDays},{id:"story",label:"Cerita",Icon:BookOpen},{id:"location",label:"Lokasi",Icon:MapPin}].map(({id,label,Icon})=><a key={id} href={`#${id}`} className={active===id?"active":""} aria-current={active===id?"location":undefined}><Icon size={18} strokeWidth={1.5}/><span>{label}</span></a>)}</nav>
  </>;
}
