> **Not about this website.** This is a separate product idea for the same
> owner: a tool for tracking coin auctions and cataloguing what he buys. It lives
> here because it has nowhere better to be yet, and because the conversation it
> came from is the same one that produced the site. If it gets built it moves to
> its own repo.
>
> Nothing here is committed to. See the recommendation at the end.

# Auction scout and coin catalogue for Brandywine Coins — scoping

Draft, 3 August 2026. Not a plan yet; a shape to argue with.

## The ask, in Mike's words

> "I can't keep track of searching through a hundred auction houses every day and
> can't be in all auctions at once. I actually missed one thing I wanted just
> this weekend because I was bidding on another auction that ended at the same
> time."

> "I've tried using it to scan the catalogs. It works pretty well with ones that
> publish actual pdfs but it can't crawl the ones that are on the web."

> "I've had it scan them for actual sales comps for when I'm buying and to get an
> idea of the market."

And, when asked whether it should bid:

> "Cause I like the bidding part lol. That's fun"

Later the same evening, unprompted, about a second problem:

> "I'm going to sit and try to mess with this air table database again. I'm
> trying to zero in on what variables I need and get it so ai can scan coins and
> provide me all that backend stuff. I'm still going to have to input a few
> things for each set of images... like purchase price and auction house. Buyer
> premium etc."

> "I'm actually trying to feed it the auction pics, so theoretically i could have
> it all databased and ready to go out the door the minute i receive it"

> "I think I have to tell it no a little because it keeps trying to build this
> thing out like I'm a big business with lots of sales"

## The boundary he drew, and it should hold

**Find the lots. Do not bid.**

He drew this himself, and it happens to be the line that removes almost all of
the risk. Automated bidding moves real money irreversibly, is prohibited by most
auction houses' terms, and fails by buying the wrong coin at the wrong price. It
is also the part of the job he enjoys, which means automating it destroys value
rather than creating it.

Worth writing down now, because it is the kind of boundary that erodes once
something works: "it already knows what I want, why not just let it bid" is six
months away and the answer should still be no.

## What is actually broken

Two failures, and they are different problems:

1. **Discovery.** Lots he would have bought exist, in catalogs he did not read,
   at houses he did not check that day. Unbounded search across ~100 sources.
2. **Collision.** He missed a lot because two auctions closed at the same time
   and he can only be in one. That is a calendar problem, not a search problem,
   and it is the one that cost him something specific and recent.

A third, softer one:

3. **Comps.** He already uses AI for realised-price context when deciding what to
   bid. It works, it is manual, and it is the same data the other two need.

## The second problem, and it may be the first one

He is building a coin catalogue in Airtable, in the evenings, on his own. Auction
photos in, structured attributes out, so a lot is "databased and ready to go out
the door the minute I receive it".

Three things follow from that, and they change the shape of this document.

**It is the strongest signal in the whole conversation.** The auction monitoring
is something he agreed would be useful when asked. The catalogue is something he
is spending his evenings on unprompted. Revealed preference beats stated
preference, and this is the one he is actually doing.

**It is the same data.** A lot he is watching and a lot he has won are the same
record at different points in its life -- title, description, images, estimate,
realised price, provenance. If ingestion already pulls that for monitoring, a
won lot arrives at the catalogue mostly populated, and the fields he says the AI
cannot infer are exactly the ones ingestion knows for free:

    "it can't really know up front like purchase price and auction house.
     Buyer premium etc."

Auction house is a field on the lot. Hammer price is the realised price.
Buyer's premium is a per-house rate applied to it. All three are structural, not
inferential, and re-keying them by hand is the tedium he is describing.

**Airtable is the incumbent, and it might win.** If it does the job, nothing
should be built. The question is not "could we build this" but "what does Airtable
not do", and the answer is probably: it does not know the auction house's premium
rate, it does not pull the lot data automatically, and it does not connect to what
he is about to list. Worth asking rather than assuming.

His frustration is also a design constraint, stated plainly:

> "it keeps trying to build this thing out like I'm a big business with lots of
> sales"

Whatever gets built should be sized for one dealer with a few hundred coins, not
for the business he might have in five years.

## Scope

**In**

- Ingest lots from a named set of auction houses
- Match them against wants he defines
- Alert him with enough lead time to plan around closes
- Show a calendar of everything closing, so collisions are visible before they
  happen
- Keep realised prices as they land, so comps accumulate as a by-product
- Carry a won lot into a catalogue record, with the fields ingestion already knows
  filled in
- Hold the attributes he needs to write a listing

**Out, deliberately**

- Bidding, proxy bidding, sniping, or anything that touches an account
- Payment, invoicing, shipping, and anything eBay already does once a listing is
  live. The catalogue's job ends where the listing begins
- Being comprehensive. A hundred houses is the ambition, not the first release

## The hard part, named early

**Ingestion is the whole project.** Everything downstream is ordinary Rails.

A hundred auction houses is a hundred different sites. Some publish PDF catalogs,
which Mike says already work. Some are HTML that changes without notice. Some
render lots in JavaScript. Very few have an API. Each one is a small adapter and
an ongoing maintenance liability — this is the cost that does not show up in a
demo and does show up every month afterwards.

Two consequences worth accepting up front:

- **Start with the houses he actually buys from.** He said a hundred; he probably
  buys from ten. The other ninety carry most of the maintenance and little of the
  value. If ten houses do not change what he wins, a hundred will not either.
- **Degrade honestly.** When an adapter breaks, the system should say so loudly
  rather than quietly returning nothing. Silent zero results look identical to "no
  matching lots this week", and that is how a tool like this dies without anyone
  noticing.

**Terms of service are a real constraint, not a footnote.** Several auction
platforms prohibit automated access. Public catalog data fetched at a polite rate
for one dealer's own buying is a different posture from scraping at scale, but it
should be a deliberate decision per house, and houses that clearly forbid it
should be entered by hand or skipped. Worth asking Mike which platforms he has
accounts with, since terms often differ for registered bidders.

## Shape, if it is Rails

Rails fits: this is CRUD, background jobs, and email, which is Rails' home
ground. It also matches the rest of the studio, which matters more than it
sounds — one deploy story, one place secrets live, one runtime to keep patched.

**Model sketch**

    AuctionHouse   name, url, ingest_adapter, active, last_ingest_at, last_error
    Sale           auction_house, title, opens_at, closes_at, source_url
    Lot            sale, lot_number, title, description, estimate_low/high,
                   currency, closes_at, source_url, image_url, realized_price
    Want           label, query, keywords, country, denomination,
                   year_from/to, max_price, active
    Match          lot, want, score, state (new / watching / dismissed / won / lost)
    Alert          match, channel, sent_at, opened_at
    Comp           derived from Lot where realized_price is present

    Coin           lot (nullable -- not everything is bought at auction),
                   title, country, denomination, year, mintage, grade,
                   grader, cert_number, notes
    Acquisition    coin, auction_house, hammer_price, buyers_premium_rate,
                   fees, total_cost, acquired_on
    Photo          coin, source (auction / own), url

`Coin` hanging off `Lot` is the join that makes this worth building rather than
buying: everything on `Acquisition` except the grade is already known from
ingestion, and those are precisely the fields Mike says he has to key by hand
today.

`Match` carrying state is what makes it a tool rather than a firehose. A lot he
has dismissed should never surface again; one he is watching should get a second
alert as the close approaches.

**Jobs**

- One ingest job per house, scheduled, isolated — a broken adapter fails one
  house and not the run
- A matching job after each ingest
- An alerting job that batches rather than emailing per lot
- A closing-soon sweep that produces the calendar and flags collisions

**Studio fit, with one trap already known**

- Postgres on ger3, as a standalone Coolify resource — same pattern as the
  brandywine CMS database, backups included
- Rails 8's Solid Queue means no Redis to run
- **Email must go over HTTP, not SMTP.** ger3 blocks outbound 25, 465 and 587,
  and those connections *time out rather than refusing*, so a mailer would hang
  silently. Verified today. ForwardEmail's HTTP API on :443 is the way out, and
  there is now a working adapter pattern to copy from the brandywinecoins repo.
- pgvector is already in use on ger3 and would suit "lots like this one" matching
  better than keyword search alone, once keyword matching proves insufficient

## Slices, reordered

Adding the catalogue changes the order. The original plan led with monitoring
because that is what he was asked about. He is building the catalogue himself,
which is a better signal than an answer to a question.

**1 — The catalogue, for lots he has already won**

Coins, acquisitions, photos. No scraping: he enters the auction house and hammer
price, the same as Airtable today, and the app computes premium and total cost
from a per-house rate.

Small, and it competes directly with the thing he is already using — which is the
point. If it does not beat Airtable at this, nothing later will, and finding that
out costs a week rather than a quarter.

**2 — Ingestion for the houses he buys from**

Five or ten, PDF catalogs first since those already work for him. Now a won lot
carries its own data into the catalogue and the hand-keying stops. This is where
the join earns its keep, and it is worth nothing without slice 1.

**3 — Wants, alerts, and the closing calendar**

The original slice 1. Match ingested lots against what he is hunting, alert with
lead time, mark collisions. This is what would have caught last weekend's miss.

Deliberately after ingestion rather than driving it, because alerts on two houses
are a novelty and alerts on ten are a tool.

**4 — Comps**

Realised prices have been accumulating since slice 2 for free. Turn them into the
market view he currently assembles by hand.

Still the most durable asset here: a private, accurate comps database for the
categories he actually trades. Everything above is plumbing that produces it.

## What would kill this

- The houses he cares about turn out not to publish anything machine-readable,
  and the tool degrades into manual entry he will not do
- Adapter maintenance outruns the value, which is the normal failure of scraping
  projects and the reason to start with ten
- Alerts arrive but do not change behaviour, because the real constraint is
  capital or time rather than awareness. Worth asking whether he would have won
  the missed lot if he had known — or just been in two places at once with the
  same money

## Recommendation

Do not build yet. Ask the questions first — especially what Airtable is not
doing, and which fields he keys by hand. Those two decide whether slice 1 is
worth a week or is already solved.

The order matters more than the answers, though. Lead with the catalogue, because
he is already building it and that is the only evidence in this document that is
not a reply to a question someone asked him.
