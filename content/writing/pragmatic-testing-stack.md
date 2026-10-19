---
title: A Pragmatic Testing Stack for Solo Developers
date: 2025.12.09
tags: [Testing, Linux, Engineering]
summary: Test the seams, keep the suite honest, and let CI be the referee.
read: 5 min
---

Test suites do not fail because developers dislike tests. They fail because a red build stops meaning anything.

## Test the seams

Solo projects die at integration points: config parsing, API clients, data migrations. Those seams deserve tests; the trivial glue usually does not.

## Determinism over coverage

A flaky 90% suite is worth less than a stable 40% one. Quarantine unstable cases immediately — a red build must always mean something.

## CI is the referee

Run the same commands locally and in CI. When the referee and the players follow different rulebooks, nobody trusts the score.
