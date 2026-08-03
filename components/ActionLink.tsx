import s from './ActionLink.module.css';

/* Re-exported so existing call sites keep working. The address itself lives in
   lib/business.ts -- a module about how a link looks should not own the
   business's email. */
export { CONTACT_EMAIL, CONTACT_HREF } from '../lib/business';

export default function ActionLink({
  href,
  children,
  variant = 'secondary',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <a className={variant === 'primary' ? s.primary : s.secondary} href={href}>
      <span className={s.label}>{children}</span>
    </a>
  );
}
