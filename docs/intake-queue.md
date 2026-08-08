# The intake queue

An Airtable interface that turns "1500 half-filled rows" into a pile you can
work down one coin at a time, on a phone, while holding the coin.

Interfaces cannot be created through the API, so this is a build sheet rather
than a script.

## Do not share this interface

It shows `Total Cost Basis` and `Minimum Acceptable Price`. It is for Mike, and
for nobody else. The public chat is careful about those two columns precisely
because they are the ones that cost money if a buyer sees them.

## What drives it: the `Needs` field

Added to Inventory as a formula. It returns what a coin still needs before it
can be listed, as plain text, and empty when the coin is ready:

    photo, grade, price, title, description

Sold and archived coins always return empty, so they leave the queue instead of
sitting in it forever. The formula lives in the field description in Airtable;
`scratchpad/needs_field.py` is what created it.

Two consequences worth knowing:

- The queue filter is just **Needs is not empty**. No compound condition to
  maintain, and adding a new requirement later means editing one formula rather
  than every view that depends on it.
- It reads in the ordinary grid too. Somebody scrolling Inventory sees
  `photo, price` next to a coin without opening anything.

## Status: built

It exists, as the **Intake queue** page under *Inventory Management* in the
"Brandywine Coins Inventory" interface. Filter and sort are set and verified
against real rows: the ready coin drops out, and BWC-2026-0000074 shows
`Needs: price`.

Three things it does not have, and why:

- **It is not published.** Publishing pushes every page in that interface live,
  including the three template pages below, which are broken. Publishing is a
  decision about those, not about this page.
- **Field order is table order**, not the order in the build sheet below.
  Reordering is drag-and-drop on the canvas, which is a two-minute job by hand
  and a bad one to automate. The order that matters is `Melt value` and
  `Total Cost Basis` above `Asking Price`; today they sit below it.
- **`Status` was added** to the field set, which the build sheet did not ask
  for. `Needs` excludes sold and archived coins but not coins on hold, and
  pricing a coin that is being held for somebody is a real mistake to make.

## The template pages are broken

The interface already contained *Currently Listed Inventory*, *Inventory
Awaiting Research* and *Inventory Ready to List*, all from the Airtable template
the base started as. All three show **"No records found that match current
filters"**: they filter on `Stage`, which was deleted as redundant once `Status`
took over.

They have never been published, so nobody has seen them fail. They should be
deleted or repointed before anyone is shown the interface, or the first
impression is three empty screens.

## Build sheet

**Interfaces → Start building → Record review**, source table **Inventory**.

**Filter:** `Needs` is not empty
**Sort:** `Purchase Date`, oldest first — so the backlog drains instead of
growing a tail nobody reaches.

**Layout, top to bottom.** The order matters: everything above the inputs is
context for the decision, everything below is the decision.

| | Field | Editable |
|---|---|---|
| header | `Needs` | no — this is the "why am I looking at this" line |
| | `Inventory ID` | no |
| photo | `Photo Attachments` | **yes** — this is also how a photo gets added |
| context | `Country` · `Date` · `Denomination` · `Ruler/Issuer` | no |
| numbers | `Melt value` · `Total Cost Basis` | no — the floor and what it owes |
| input | `Estimated Grade` | **yes** |
| input | `Asking Price` | **yes** |
| input | `Minimum Acceptable Price` | **yes** |
| input | `Listing Title` | **yes** |

`Melt value` and `Total Cost Basis` sit directly above `Asking Price` on purpose.
Those are the two numbers that answer "what can I ask for this", and having to
navigate to find them is how a coin gets priced on instinct instead.

## What to leave out, and why

**No `Listing Description`.** It is long, it is the thing the listing-copy
workflow writes, and putting a big empty text box in a phone queue invites
someone to type a paragraph standing up. `Needs` will still say `description`,
which is correct — it just gets filled somewhere else.

**No cost inputs.** Purchase price, premium and shipping come off the auction
invoice, in a batch, at a desk. Different job, different screen.

**No buttons yet.** An interface button can run an Airtable automation, which can
call an n8n webhook, which is how *Draft eBay listing* becomes a button rather
than a workflow Mike has to open. That is the right end state and it is phase
two: prove one throwaway button works under his plan and permissions before
designing around it.

## Later, once the coins land

The single queue splits naturally once there is volume, using the same field:

- `FIND("photo", {Needs})` — coins to photograph, a desk job with the light out
- `FIND("price", {Needs})` — coins to price, needs the melt and cost numbers
- `FIND("grade", {Needs})` — coins to assess, needs the coin in hand

Same data, three piles, because they are three different sittings. Splitting
before there is a backlog just makes three empty screens.
