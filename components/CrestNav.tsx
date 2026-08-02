import ActionLink, { CONTACT_HREF } from './ActionLink';
import s from './CrestNav.module.css';

/**
 * Primary sits in the centre, not on the left: symmetry is this composition's
 * whole structural argument, and a left-weighted primary pulls the axis off.
 */
export default function CrestNav({ className }: { className?: string }) {
  return (
    <nav className={[s.nav, className].filter(Boolean).join(' ')} aria-label="Primary">
      <ActionLink href="#about">About Us</ActionLink>
      <ActionLink href={CONTACT_HREF} variant="primary">
        Get in Touch
      </ActionLink>
      <ActionLink href="#shop">Shop</ActionLink>
    </nav>
  );
}
