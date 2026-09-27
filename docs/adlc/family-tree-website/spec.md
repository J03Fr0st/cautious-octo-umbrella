---
adlc: spec
slug: family-tree-website
status: approved
source: docs/adlc/family-tree-website/intent.md@e647cc4e0c373daf5fa5f2957ef64a980735042d
---

# Private family tree website

> Drafted by an agent from the approved intent; decisions marked with an owner await a human.

## Behavior

**Access.** The site is private to one family. The owner (Joe) invites relatives by email address. An invited relative signs in with the Google account for that email. Anyone else, including someone signed in with a Google account that wasn't invited, sees no family data. The owner can remove an invitation, and that person loses access.

**People and relationships.** Each person has a name and may also have:
- a gender
- birth and death dates, which may be partial or approximate (for example "about 1920" or "March 1945")
- birth, death and residence places
- free-text notes

People are connected through parent–child and partner relationships:
- A person can have several partners over time, such as a marriage followed by a divorce or remarriage.
- A parent–child link is marked biological, adopted or step.
- A person may have one or both parents unknown.

**Viewing and navigating.** The tree is drawn as a visual diagram. A viewer can:
- pan and zoom around it, with a mouse or with touch gestures
- select a person to centre the view on them, with ancestors above and descendants below
- open a person's details
- search by name and jump to a matching person
- pick any two people and see how they are related: the named relationship (for example "second cousin once removed") and the chain of people linking them

**Editing.** Any invited relative can add a person, edit someone's details, and add or remove relationships. Changes are visible to everyone else straight away.

**History and undo.** Every change records who made it, when, and what changed. The owner can view this history and revert any single change.

**Import and export.** The owner can import a GEDCOM file to add its people and relationships to the tree. Anyone signed in can download the whole tree as a GEDCOM file.

**Devices.** Everything above works on a phone browser as well as on a desktop browser.

## Acceptance criteria

### Access

- **AC-001**: Given a visitor who isn't signed in, when they open any page of the site, then they see only a sign-in screen and no names or other family data.
  Must not: expose family data in the page source, in network responses, or through direct links. Verify by: automated test hitting every page and data endpoint without signing in.
- **AC-002**: Given an email the owner has invited, when that person signs in with the matching Google account, then they see the family tree.
  Verify by: automated end-to-end test with a test account, plus a manual check with one real relative.
- **AC-003**: Given a Google account that hasn't been invited, when it signs in, then it gets a "not invited" message and no family data.
  Verify by: automated test.
- **AC-004**: Given a signed-in relative whose invitation the owner has revoked, when they next load or act on the site, then they lose access.
  Verify by: automated test.
- **AC-005**: Given a relative who isn't the owner, when they try to reach an owner-only function (invitations, history and revert, import), then they are refused.
  Verify by: automated test.

### Recording people and relationships

- **AC-006**: Given a signed-in relative, when they add a person with any combination of the person fields (name required; gender, dates, places and notes optional), then the person appears in the tree with those details.
  Verify by: automated test.
- **AC-007**: Given a date entered as partial or approximate ("1920", "March 1945", "about 1880"), when it is saved and shown again, then it keeps its precision and isn't turned into a false exact date.
  Verify by: automated test covering each form.
- **AC-008**: Given a person, when a relative links a parent or child and marks the link as biological, adopted or step, then the tree shows the link, and adopted or step links look different from biological ones.
  Verify by: automated test plus visual check.
- **AC-009**: Given a person with two or more partners, some of them former, when the tree is shown, then each partnership appears with its own children under it.
  Verify by: automated test plus visual check.
- **AC-010**: Given a person with one or both parents unknown, when the tree is shown, then the person is placed correctly and no placeholder relative is made up.
  Verify by: automated test.

### Visual navigation

- **AC-011**: Given the tree view, when a viewer drags or pinches (touch) or drags or scrolls (mouse), then the view pans and zooms smoothly.
  Verify by: manual check on a desktop browser and on a phone.
- **AC-012**: Given the tree view, when a viewer selects a person, then the view centres on that person with ancestors above and descendants below, and their details can be opened.
  Verify by: automated end-to-end test.
- **AC-013**: Given a typed name or part of one, when the viewer searches, then matching people are listed, and choosing one centres the tree on them.
  Verify by: automated test.
- **AC-014**: Given any two people in the tree, when a viewer asks how they are related, then the site shows the named relationship and the chain of people linking them, or says they have no known connection.
  Verify by: automated test against a fixture tree with known answers, including cousins, in-laws and "removed" cases.
- **AC-015**: Given a tree of 1,000 people, when a viewer opens it, pans, zooms, searches or centres on a person, then the site stays responsive on a mid-range phone.
  Verify by: performance check against a generated 1,000-person tree. The exact thresholds are an open question.

### Editing, history and undo

- **AC-016**: Given two relatives signed in at once, when one saves a change, then the other sees it the next time they load or refresh the affected view, without having to sign in again.
  Verify by: automated test.
- **AC-017**: Given any add, edit or delete of a person or relationship, when it is saved, then a history entry records who made it, when, and the before and after values.
  Verify by: automated test.
- **AC-018**: Given a history entry, when the owner reverts it, then that change is undone and the revert itself is recorded in the history.
  Must not: silently undo later changes that didn't depend on it. Verify by: automated test.

### Import and export

- **AC-019**: Given a valid GEDCOM file exported from a common genealogy tool, when the owner imports it, then its people, their details and their relationships appear in the tree, and the owner sees a summary of what was imported and anything that was skipped.
  Verify by: automated test with sample GEDCOM files.
- **AC-020**: Given an invalid or unreadable file, when the owner tries to import it, then nothing in the tree changes and a clear error is shown.
  Verify by: automated test.
- **AC-021**: Given the current tree, when a signed-in relative exports it, then they get a GEDCOM file, and importing that file into an empty tree reproduces the same people, details and relationships.
  Verify by: automated round-trip test.

### Devices

- **AC-022**: Given a phone-sized screen (360 px wide and up), when a relative uses any feature above, then it can be completed without horizontal page scrolling or controls that are too small to tap.
  Verify by: manual walkthrough on a real phone plus automated checks at phone width.

### Outcome signals, read after launch

- **AC-023** (whole tree captured): Given the site in use, when the owner reviews the tree, then everyone in the family the owner knows about is recorded.
  Verify by: owner's review. This is an outcome signal, not a build gate.
- **AC-024** (family uses it): Given launch, when 3 months have passed, then at least 5 invited relatives have signed in and browsed on their own.
  Verify by: a count of distinct relatives who signed in, which the owner can see. This is an outcome signal, not a build gate.

## Constraints

- **Privacy.** The site holds personal data about living people. All family data is behind sign-in, and only invited relatives see it. Search engines must not index the site. Data is sent only over encrypted connections.
- **Security.** Only Google accounts whose email was invited get access. Owner-only functions are enforced on the server, not just hidden in the interface. Imported files are treated as untrusted input.
- **Data durability.** The family's data must survive a failure; there must be backups the owner can restore from. GEDCOM export also keeps the data from being locked into this site.
- **Scale.** Built for about 100 to 1,000 people and a few dozen relatives.
- **Compatibility.** Current versions of the major browsers on desktop, Android and iOS.

## Boundaries

- **Always:** keep family data behind sign-in; record every change in the history; keep a person's data intact through GEDCOM import and export.
- **Ask first:** adding any third-party service that receives family data; changing who can reach owner-only functions; any change that deletes data in bulk.
- **Never:** make family data public or indexable; make up relatives or relationships; share family data with services that aren't needed to run the site.

## Out of scope

- DNA results or matching with other trees
- Searching historical records (census, birth, archive)
- Photos, document scans and file attachments for each person (free-text notes are in scope)
- A product for other families: no outside accounts and no billing
- Hiding details of living people from some relatives; everyone invited sees everything
- Sign-in methods other than Google

## Areas of concern

- **Google-only sign-in could exclude some relatives.** Some relatives, especially older ones, may not have a Google account or may struggle with it. That works against "the family actually uses it". Owner: Joe.
- **Importing GEDCOM into a tree that already has people can create duplicates.** This spec only requires import to add people, not to merge them with existing records. Owner: Joe.
- **Two relatives editing the same person at the same time.** With direct editing, the later save wins, and the history lets the owner recover. Is that acceptable? Owner: Joe.
- **Only Joe can administer the site.** If Joe is unavailable, no one can manage invitations or revert changes. Owner: Joe.

## Open questions

- What counts as "responsive" for AC-015? For example, the tree first appears within 3 seconds and panning feels smooth on a mid-range phone. Owner: Joe, with a proposal from the plan.
- Where will the site be hosted, and who pays for it? This affects the backup and privacy constraints. Owner: Joe.
- Should anyone other than the owner be able to see how many relatives have signed in (AC-024)? Owner: Joe.

## Approvals

| Stage | Decision | Approver | Date | Reviewed revision | Conditions / reasons |
| --- | --- | --- | --- | --- | --- |
| spec | approved-with-conditions | Joe (owner) | 2026-09-27 | e3352aed2bbf6f23c0c493a9be1ebb25aff5a111 | Plan proposes AC-015 thresholds for sign-off |
