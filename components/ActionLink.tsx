import s from './ActionLink.module.css';

export const CONTACT_EMAIL = 'info@brandywinecoins.net';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;

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
