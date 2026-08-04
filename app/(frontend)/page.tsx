import Hero from '@/components/Hero';
import About from '@/components/About';
import Shop from '@/components/Shop';
import Footer from '@/components/Footer';

/**
 * Rendered per request rather than prerendered, because About reads the CMS and
 * the build cannot reach the database.
 *
 * That is not a preference, it is the deploy: nixpacks builds this in a docker
 * build context that is not attached to the database's network, so a build-time
 * query fails with `connect ETIMEDOUT 172.18.0.2:5432`. Prerendering would ship
 * whatever the build could see, which is nothing.
 *
 * Falling back to the committed seed at build time was the other option and is
 * worse: every deploy would quietly revert the page to the seed until Mike next
 * saved. Serving one query from a database on the same host is cheaper than a
 * class of stale-content bug nobody would notice.
 *
 * The `about` global's afterChange hook still calls revalidatePath('/'), which
 * costs nothing here and keeps working if this ever goes back to being cached.
 */
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <About />
        <Shop />
      </main>
      {/* Outside <main>, so it is the page's contentinfo landmark rather than
          part of the main content -- which is what lets a screen reader user
          jump to the contact details directly. */}
      <Footer />
    </>
  );
}
