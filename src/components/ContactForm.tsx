import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SubmitEvent, type JSX } from 'react';
import { site } from '../config/site';
import { briefLimits, briefOptions, briefText, emailPattern, type Brief } from '../lib/enquiry';
/** `enquiryEndpoint` is empty until delivery is configured; the review then only offers the download and email draft. */
interface Props { bookingUrl: string; email: string; enquiryEndpoint: string; }
type Delivery = 'idle' | 'sending' | 'sent' | 'failed';
// Phones get one question per panel. Keep in step with the 760px breakpoint in global.css.
const steppedQuery = '(max-width: 760px)';
const panelCount = 4;
interface ChipsProps { legend: string; values: readonly string[]; value: string; onSelect: (value: string) => void; }
function Chips({ legend, values, value, onSelect }: ChipsProps): JSX.Element {
  return <fieldset className="form-chips"><legend>{legend}</legend><div>{values.map(item => <button type="button" key={item} aria-pressed={value === item} className={value === item ? 'selected' : ''} onClick={() => onSelect(value === item ? '' : item)}>{item}</button>)}</div></fieldset>;
}
export function ContactForm({ bookingUrl, email, enquiryEndpoint }: Props): JSX.Element {
  const [brief, setBrief] = useState<Brief>({ name: '', email: '', phone: '', business: '', budget: '', timeline: '' });
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>();
  const [interactive, setInteractive] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>('idle');
  // When the form became usable, for the endpoint's too-fast-to-be-human check.
  const openedAt = useRef(0);
  // One id per reviewed brief, so a retry after a dropped response is not delivered twice.
  const briefId = useRef('');
  const honeypot = useRef<HTMLInputElement>(null);
  // SSR controls must not fall back to a native GET with personal data in the URL.
  useEffect(() => { setInteractive(true); openedAt.current = Date.now(); }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const panelList = useRef<HTMLDivElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const leavingHeight = useRef(0);
  // Panels differ in height. Ease the card from the old panel's height to the new one's so Next glides rather than jumps; the end state is the new panel's natural height.
  useLayoutEffect(() => {
    const list = panelList.current;
    const from = leavingHeight.current;
    leavingHeight.current = 0;
    if (!list || !from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = list.offsetHeight;
    if (to !== from) list.animate({ height: [`${from}px`, `${to}px`], overflow: ['clip', 'clip'] }, { duration: 250, easing: getComputedStyle(list).getPropertyValue('--ease-out') || 'ease-out' });
  }, [panel]);
  function update(key: keyof Brief, value: string): void { setBrief(current => ({ ...current, [key]: value })); setError(''); }
  function show(next: number, target?: () => HTMLElement | null): void {
    leavingHeight.current = panelList.current?.offsetHeight ?? 0;
    setDirection(next > panel ? 'forward' : 'back');
    setPanel(next);
    // The panel that held focus is now hidden. Land on the new panel's first choice, or on Next for the details panel so no keyboard pops up.
    requestAnimationFrame(() => (target?.() ?? panelList.current?.children[next]?.querySelector<HTMLElement>('.form-chips button') ?? submitButton.current)?.focus());
  }
  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!brief.name.trim() || !emailPattern.test(brief.email.trim())) {
      setError('Add your name and a valid email to prepare your project brief.');
      const field = brief.name.trim() ? emailInput : nameInput;
      if (panel === 0) field.current?.focus(); else show(0, () => field.current);
      return;
    }
    if (panel < panelCount - 1 && window.matchMedia(steppedQuery).matches) { show(panel + 1); return; }
    briefId.current = crypto.randomUUID();
    setDelivery('idle');
    setStep('review');
    requestAnimationFrame(() => heading.current?.focus());
  }
  function edit(): void { setDirection(undefined); setPanel(0); setStep('form'); }
  async function send(): Promise<void> {
    setDelivery('sending');
    try {
      const response = await fetch(enquiryEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...brief, id: briefId.current, website: honeypot.current?.value ?? '', elapsed: Date.now() - openedAt.current }) });
      setDelivery(response.ok ? 'sent' : 'failed');
    } catch { setDelivery('failed'); }
    requestAnimationFrame(() => heading.current?.focus());
  }
  const backButton = <button className="text-button form-back" type="button" onClick={() => show(panel - 1)}>← Back</button>;
  const text = briefText(brief);
  const firstName = brief.name.trim().split(/\s+/)[0];
  const sent = delivery === 'sent';
  // With delivery configured, the email draft is only the fallback after a failed send.
  const offerDraft = Boolean(email) && (!enquiryEndpoint || delivery === 'failed');
  function download(): void { const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = site.briefFilename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  return <div className="contact-card" style={{ '--card-mark': `url("${site.brandAssets.mark.ink}")` } as CSSProperties}><div className="process-card-header"><span className="status-dot" /><span className="eyebrow"><span className="form-label-wide">{step === 'form' ? 'Step 1 of 2 · About you' : bookingUrl ? 'Step 2 of 2 · Pick a time' : 'Step 2 of 2 · Your project brief'}</span><span className="form-label-stepped" aria-live="polite">{`Step ${step === 'form' ? panel + 1 : panelCount + 1} of ${panelCount + 1}`}</span></span><div className="form-progress" aria-hidden="true">{Array.from({ length: panelCount + 1 }, (_, index) => <span key={index} className={index <= (step === 'form' ? panel : panelCount) ? 'complete' : ''} />)}</div></div>
    {step === 'form' ? <form className="project-form" onSubmit={submit} noValidate>
      <fieldset className="form-fields" aria-label="Project details" disabled={!interactive}>
      <div className="form-panels" ref={panelList} data-direction={direction}>
      <div className={`form-panel${panel === 0 ? ' active' : ''}`}><label><span>Name</span><input ref={nameInput} name="name" autoComplete="name" value={brief.name} onChange={event => update('name', event.target.value)} placeholder="Full name" required maxLength={briefLimits.name} aria-invalid={Boolean(error) && !brief.name.trim()} aria-describedby={error ? 'contact-error' : undefined} /></label>
      <div className="form-two-columns"><label><span>Email</span><input ref={emailInput} name="email" type="email" autoComplete="email" value={brief.email} onChange={event => update('email', event.target.value)} placeholder="you@business.com" required maxLength={briefLimits.email} aria-invalid={Boolean(error) && !emailPattern.test(brief.email.trim())} aria-describedby={error ? 'contact-error' : undefined} /></label><label><span>Phone <small>· optional</small></span><input name="phone" type="tel" autoComplete="tel" value={brief.phone} onChange={event => update('phone', event.target.value)} placeholder="(555) 000-0000" maxLength={briefLimits.phone} /></label></div></div>
      <div className={`form-panel${panel === 1 ? ' active' : ''}`}>{backButton}<Chips legend="Business type" values={briefOptions.business} value={brief.business} onSelect={value => update('business', value)} /></div>
      <div className={`form-panel${panel === 2 ? ' active' : ''}`}>{backButton}<Chips legend="Budget" values={briefOptions.budget} value={brief.budget} onSelect={value => update('budget', value)} /></div>
      <div className={`form-panel${panel === 3 ? ' active' : ''}`}>{backButton}<Chips legend="Timeline" values={briefOptions.timeline} value={brief.timeline} onSelect={value => update('timeline', value)} /></div>
      </div>
      {enquiryEndpoint && <label className="sr-only" aria-hidden="true">Website<input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" /></label>}
      {error && <p className="form-error" id="contact-error" role="alert">{error}</p>}
      <button ref={submitButton} className="button button-ink form-submit" type="submit">{panel < panelCount - 1 && <span className="form-next-label">Next</span>}<span>{bookingUrl ? 'Pick a time' : 'Review your brief'}</span><span className="button-circle">→</span></button><span className="form-footnote">{bookingUrl ? 'Free call. No commitment.' : enquiryEndpoint ? 'Review before sending. Nothing is sent yet.' : 'Review and download. Nothing is sent or booked.'}</span>
      </fieldset>
    </form> : <div className="project-form brief-review">{!sent && <button className="text-button" onClick={edit} disabled={delivery === 'sending'}>← Edit details</button>}<h3 ref={heading} tabIndex={-1}>{sent ? <>Brief sent, <em>{firstName}.</em></> : <>Thanks, <em>{firstName}.</em></>}</h3><p>{sent ? `Your brief is in our inbox. We will reply to ${brief.email.trim()}. A call has not been booked yet.` : bookingUrl ? 'Your brief is ready. Your details have not been sent and a call has not been booked. Choose and confirm a time in the external calendar. Your brief is not passed to the calendar automatically.' : enquiryEndpoint ? 'Your project brief is ready. Check the details, then send it to us. Nothing has been sent yet.' : 'Your project brief is ready. Save a copy to keep your details together. A call has not been booked and your details have not been sent.'}</p><dl>{(['name', 'email', 'phone', 'business', 'budget', 'timeline'] as const).map(key => <div key={key}><dt>{key}</dt><dd>{brief[key] || 'Not provided'}</dd></div>)}</dl>{enquiryEndpoint && !sent && <button className="button button-ink form-submit" onClick={send} disabled={delivery === 'sending'} aria-busy={delivery === 'sending'}><span>{delivery === 'sending' ? 'Sending…' : delivery === 'failed' ? 'Try sending again' : 'Send your brief'}</span><span className="button-circle">→</span></button>}{delivery === 'failed' && <p className="form-error" role="alert">We could not send your brief. Try again, or email it to us instead.</p>}{bookingUrl && <a className="button button-ink" href={bookingUrl} target="_blank" rel="noopener noreferrer">Open booking calendar ↗</a>}{offerDraft && <><a className="button button-outline" href={`mailto:${email}?subject=${encodeURIComponent(`${site.name} project enquiry`)}&body=${encodeURIComponent(text)}`}>Email your brief →</a><p className="brief-email-note">Opens a draft in your email app. You choose whether to send it.</p></>}<button className="button button-outline" onClick={download}>Download your brief ↓</button></div>}
    <p className="form-privacy">Reviewing or downloading does not send your details to us.{enquiryEndpoint && ' Sending your brief emails it to our inbox.'} Read our <a href="/privacy/">Privacy &amp; Cookies notice</a>.</p>
    <noscript><p className="form-noscript">Enable JavaScript to prepare your brief.{email && <> You can also <a href={`mailto:${email}`}>email us directly</a>.</>}</p></noscript>
  </div>;
}
