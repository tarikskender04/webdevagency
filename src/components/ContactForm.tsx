import { useRef, useState, type SubmitEvent, type JSX } from 'react';
interface Props { bookingUrl: string; email: string; }
interface Brief { name: string; email: string; phone: string; business: string; budget: string; timeline: string; }
interface ChipsProps { legend: string; values: readonly string[]; value: string; onSelect: (value: string) => void; }
function Chips({ legend, values, value, onSelect }: ChipsProps): JSX.Element {
  return <fieldset className="form-chips"><legend>{legend}</legend><div>{values.map(item => <button type="button" key={item} aria-pressed={value === item} className={value === item ? 'selected' : ''} onClick={() => onSelect(value === item ? '' : item)}>{item}</button>)}</div></fieldset>;
}
export function ContactForm({ bookingUrl, email }: Props): JSX.Element {
  const [brief, setBrief] = useState<Brief>({ name: '', email: '', phone: '', business: '', budget: '', timeline: '' });
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  function update(key: keyof Brief, value: string): void { setBrief(current => ({ ...current, [key]: value })); setError(''); }
  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!brief.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brief.email.trim())) {
      setError('Add your name and a valid email so we can send the invite.');
      (brief.name.trim() ? emailInput : nameInput).current?.focus();
      return;
    }
    setStep('review');
    requestAnimationFrame(() => heading.current?.focus());
  }
  const text = `Meridian project brief\n\nName: ${brief.name.trim()}\nEmail: ${brief.email.trim()}\nPhone: ${brief.phone || 'Not provided'}\nBusiness: ${brief.business || 'To discuss'}\nBudget: ${brief.budget || 'To discuss'}\nTimeline: ${brief.timeline || 'To discuss'}\n`;
  function download(): void { const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'meridian-project-brief.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  return <div className="contact-card"><div className="process-card-header"><span className="status-dot" /><span className="eyebrow">{step === 'form' ? 'Step 1 of 2 · About you' : bookingUrl ? 'Step 2 of 2 · Pick a time' : 'Step 2 of 2 · Your project brief'}</span><div className="form-progress" aria-hidden="true"><span /><span className={step === 'review' ? 'complete' : ''} /></div></div>
    {step === 'form' ? <form className="project-form" onSubmit={submit} noValidate>
      <label><span>Name</span><input ref={nameInput} name="name" autoComplete="name" value={brief.name} onChange={event => update('name', event.target.value)} placeholder="Full name" required maxLength={100} aria-invalid={Boolean(error) && !brief.name.trim()} aria-describedby={error ? 'contact-error' : undefined} /></label>
      <div className="form-two-columns"><label><span>Email</span><input ref={emailInput} name="email" type="email" autoComplete="email" value={brief.email} onChange={event => update('email', event.target.value)} placeholder="you@business.com" required maxLength={254} aria-invalid={Boolean(error) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brief.email.trim())} aria-describedby={error ? 'contact-error' : undefined} /></label><label><span>Phone <small>· optional</small></span><input name="phone" type="tel" autoComplete="tel" value={brief.phone} onChange={event => update('phone', event.target.value)} placeholder="(555) 000-0000" maxLength={40} /></label></div>
      <Chips legend="Business type" values={['Restaurant / café', 'Retail', 'Salon / beauty', 'Trades / services', 'Other']} value={brief.business} onSelect={value => update('business', value)} />
      <Chips legend="Budget" values={['Under $3k', '$3–6k', '$6–12k', '$12k+']} value={brief.budget} onSelect={value => update('budget', value)} />
      <Chips legend="Timeline" values={['ASAP', '1–2 months', '3+ months', 'Just exploring']} value={brief.timeline} onSelect={value => update('timeline', value)} />
      {error && <p className="form-error" id="contact-error" role="alert">{error}</p>}
      <button className="button button-ink form-submit" type="submit">{bookingUrl ? 'Pick a time' : 'Review your brief'}<span className="button-circle">→</span></button><span className="form-footnote">Free call. No commitment.</span>
    </form> : <div className="project-form brief-review"><button className="text-button" onClick={() => setStep('form')}>← Edit details</button><h3 ref={heading} tabIndex={-1}>Thanks, <em>{brief.name.trim().split(/\s+/)[0]}.</em></h3><p>{bookingUrl ? 'Your brief is ready. Choose a time in our booking calendar to finish scheduling your call.' : 'Your project brief is ready. Save a copy to keep your details together. A call has not been booked and your details have not been sent.'}</p><dl>{(['name', 'email', 'business', 'budget', 'timeline'] as const).map(key => <div key={key}><dt>{key}</dt><dd>{brief[key] || 'To discuss'}</dd></div>)}</dl>{bookingUrl && <a className="button button-ink" href={bookingUrl} target="_blank" rel="noopener noreferrer">Open booking calendar ↗</a>}{email && <a className="button button-outline" href={`mailto:${email}?subject=${encodeURIComponent('Meridian project enquiry')}&body=${encodeURIComponent(text)}`}>Email your brief →</a>}<button className="button button-outline" onClick={download}>Download your brief ↓</button></div>}
    <noscript><p className="form-noscript">Enable JavaScript to prepare your brief.{email && <> You can also <a href={`mailto:${email}`}>email us directly</a>.</>}</p></noscript>
  </div>;
}
