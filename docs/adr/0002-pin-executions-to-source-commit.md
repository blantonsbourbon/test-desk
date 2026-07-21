# Pin executions to a source commit

Every Test Execution is bound to the exact Git commit represented by its Catalog Revision. The Test Catalog follows a configured default branch, but an execution keeps the commit it was created from even if that branch advances while the run is in progress; this preserves consistency between what users saw and what ran, and makes results reproducible. The execution form also requires an explicit `dev` or `qa` Environment rather than silently choosing one, reducing the chance of running against the wrong target.
