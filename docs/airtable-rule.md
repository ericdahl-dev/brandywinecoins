# The one Airtable rule

## The sentence

> Tell me before you rename or delete a column, or rename one of the Status
> options. Everything else is yours: add columns, change data, reorder, whatever
> you like.

That is the whole rule. It is deliberately one sentence rather than a document,
because a document about someone's own spreadsheet gets ignored.

## Why it is worth saying out loud

The public chat reads a fixed list of columns **by name**. That list is also what
stops it ever showing a customer the cost basis or the floor: those columns are
not on the list, so they are never sent to the model at all.

Rename a column it reads, and nothing errors. The chat just quietly stops finding
coins. Silent, on the public site, on a Wednesday evening, with nobody watching.

## The one that is worse than a rename

The chat hides coins with this filter:

```
NOT({Hold})  AND  {Status} != 'Sold'  AND  {Status} != 'Archived'  AND  {Inventory ID} != ''
```

Those are exact strings. Rename the **Sold** option to "SOLD" or "Sold out" and
the filter stops matching it, so sold coins reappear on the public site as
available. Everything still looks like it is working. That failure runs in the
wrong direction: a broken chat is embarrassing, a chat selling coins that are
already gone is worse.

Same for the **Hold** checkbox. If it goes, coins being held come back into
public view.

## What the chat actually reads

Inventory, searching:

`Inventory ID` · `Denomination` · `Date` · `Country` · `Ruler/Issuer` ·
`Certified Grade` · `Estimated Grade` · `Asking Price` · `Listing Title`

Inventory, one coin in full:

the nine above, plus `Item Type` · `State/Region` · `Variety` ·
`Catalog Numbers` · `Attribution status` · `Diameter (mm)` · `Weight (g)` ·
`Metal/Composition` · `Edge` · `Certification Number` · `Listing Description` ·
`Historical Notes`

Gates: `Hold` · `Status`

Enquiries, written every turn: `Session` · `Transcript` ·
`Conversation Summary` · `Enquiry Type` · `Name` · `Email` · `Phone` ·
`Budget` · `Status` · `Received At`

Anything not on those lists is invisible to the chat and safe to change freely.
That includes every cost column, which is the point.

## The better fix, when there is time

A daily check that searches the catalogue and shouts if it suddenly returns
nothing, or if a column it expects has gone. That turns a silent failure into a
noisy one and makes the rule a courtesy rather than a load-bearing promise.
Until then the rule is the only thing standing there.
