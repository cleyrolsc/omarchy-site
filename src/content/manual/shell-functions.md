---
{
  "title": "Shell Functions",
  "description": "Omarchy comes with a set of shell functions to simplify common tasks and encapsulate convoluted parameter calls. Compression compress [file/dir] : Create a tar.",
  "order": 19,
  "path": "/manual/shell-functions/",
  "format": "html"
}
---

<p>Omarchy comes with a set of shell functions to simplify common tasks and encapsulate convoluted parameter calls.</p>

<h2 id="compression"><a class="manual__heading-link" href="#compression" aria-label="Link to this section">Compression<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<ul>
  <li><code>compress [file/dir]</code>: Create a tar.gz archive from the file/dir.</li>
  <li><code>decompress [file.tar.gz]</code>: Expand a tar.gz file.</li>
</ul>

<h2 id="drives"><a class="manual__heading-link" href="#drives" aria-label="Link to this section">Drives<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<ul>
  <li><code>iso2sd [image.iso]</code>: Create a bootable drive on an SD card using the referenced iso file and picking the drive interactively.</li>
  <li><code>format-drive [device] [name]</code>: Format an entire disk with a single exFAT partition (which works on Windows and macOS too). Run it without arguments to see the available drives. Be careful!</li>
</ul>

<h2 id="dev-layouts"><a class="manual__heading-link" href="#dev-layouts" aria-label="Link to this section">Dev layouts<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p>Instant multi-pane development layouts for tmux:</p>

<ul>
  <li><code>tdl [ai]</code>: Create a Tmux Dev Layout with your editor, an AI agent, and a terminal. Use the agent aliases, like <code>tdl c</code> for opencode or <code>tdl cx</code> for Claude Code, or pass a second agent to run both, like <code>tdl c cx</code>.</li>
  <li><code>tds</code>: Create a Tmux Dev Square with editor, diff watching (via <code>hunk diff --watch</code>), terminal, and opencode.</li>
  <li><code>tdlm [ai]</code>: Create a <code>tdl</code> window for every subdirectory in the current directory.</li>
  <li><code>tsl [count] [command]</code>: Create a swarm of panes tiled in a grid, all running the same command (great for AI agents).</li>
</ul>

<p>The same layouts are available for Herdr as <code>hdl</code>, <code>hds</code>, <code>hdlm</code>, and <code>hsl</code>.</p>

<h2 id="git-worktrees"><a class="manual__heading-link" href="#git-worktrees" aria-label="Link to this section">Git worktrees<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<ul>
  <li><code>ga [branch]</code>: Create a new worktree and branch next to the current repository and jump into it.</li>
  <li><code>gd</code>: Remove the current worktree and its branch (asks for confirmation first).</li>
</ul>

<h2 id="rsync-watchers"><a class="manual__heading-link" href="#rsync-watchers" aria-label="Link to this section">Rsync watchers<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<ul>
  <li><code>rsw [source] [destination]</code>: Start a background watcher that rsyncs source to destination whenever anything changes. The destination can be a remote host, like <code>rsw ~/Work/app nyc-dev:Work/app</code>.</li>
  <li><code>lsw</code>: List all active watchers.</li>
  <li><code>dsw</code>: Stop all active watchers.</li>
</ul>

<h2 id="ssh-portforwarding"><a class="manual__heading-link" href="#ssh-portforwarding" aria-label="Link to this section">SSH Portforwarding<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p>Ideal for doing web development with localhost secure-context privileges against a remote box.</p>

<ul>
  <li><code>fip</code>: Forward one or more ports from a remote host to localhost via SSH.</li>
  <li><code>dip</code>: Disconnect one or more forwarded ports.</li>
  <li><code>lip</code>: List all active SSH port forwards.</li>
</ul>

<p>Say you start a dev server on port <code>3000</code> on a machine accessible as <code>nyc-dev</code>, then you can run <code>fip nyc-dev 3000</code> to forward that port, so <code>localhost:3000</code> actually reaches <code>nyc-dev:3000</code>, but without the need for SSL certificates to establish the secure context needed for testing web sockets or the like.</p>

<h2 id="ssh-reconnection"><a class="manual__heading-link" href="#ssh-reconnection" aria-label="Link to this section">SSH reconnection<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><code>ssh</code> itself is wrapped in a function that cleans up the terminal if a connection dies while a remote tmux, Herdr, or editor has claimed it, and then automatically reconnects when an interactive session drops (Ctrl-C stops the retry loop).</p>
