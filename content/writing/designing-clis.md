---
title: Designing CLIs People Actually Use
date: 2026.06.14
tags: [Developer Tools, Python, CLI]
summary: Flags are API surface, exit codes are documentation, and two commands are usually enough.
read: 6 min
---

A command line tool is an interface with no undo button. That raises the price of every design decision, and it is a good thing.

## Flags are API surface

Every flag is a promise you will maintain for years. Before adding one, ask whether it expresses a distinct intent — or just a mood. Most moods can be a config file.

## Exit codes are documentation

Scripts consume your tool. Reserve `0` for success, use distinct codes for "bad input" and "nothing to do", and make `--help` truthful. Your future self will grep the history.

## The two-command rule

If a CLI grows past two primary verbs, split it. `devflow check` and `devflow run` cover ninety percent of days; everything else is a subcommand waiting to be deleted.
