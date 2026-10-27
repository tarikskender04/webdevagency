-- One row per Lupo download through /lupo/download/: when, in UTC, and which version. Nothing about the visitor.
CREATE TABLE lupo_downloads (
  id INTEGER PRIMARY KEY,
  downloaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  version TEXT NOT NULL
);

CREATE INDEX lupo_downloads_by_time ON lupo_downloads (downloaded_at);
