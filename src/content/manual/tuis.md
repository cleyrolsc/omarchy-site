---
{
  "title": "TUIs",
  "description": "Lazygit Lazygit is a delightful alternative to something like the GitHub Desktop application, and it runs inside the terminal. You can run it directly, by going",
  "order": 20,
  "path": "/manual/tuis/",
  "format": "html"
}
---

<h2 id="lazygit"><a class="manual__heading-link" href="#lazygit" aria-label="Link to this section">Lazygit<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><a href="https://github.com/jesseduffield/lazygit">Lazygit</a> is a delightful alternative to something like the GitHub Desktop application, and it runs inside the terminal.</p>

<p>You can run it directly, by going to any directory managed by git and running <code>lazygit</code>. Or you can run it inside Neovim where it can be started with <code>Space G G</code>.</p>

<p>You hop between the different panes using <code>Tab</code>. In the Files pane, you select files for staging using <code>Space</code>, and then you can create a new commit using <code>c</code>. You can see all the commands available using <code>?</code>.</p>

<h2 id="lazydocker"><a class="manual__heading-link" href="#lazydocker" aria-label="Link to this section">Lazydocker<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><a href="https://github.com/jesseduffield/lazydocker">Lazydocker</a> is made in the same spirit like Lazygit, and also gives you a terminal interface for managing your containers and images.</p>

<p>You can start it with <code>Super + Shift + D</code>.</p>

<p>You stop a container using <code>s</code> or start/restart it using <code>r</code>. See all commands using <code>?</code>.</p>

<h2 id="btop"><a class="manual__heading-link" href="#btop" aria-label="Link to this section">Btop<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><a href="https://github.com/aristocratos/btop">Btop</a> is a beautiful resource manager that shows memory, CPU, disk, and network usage. It also lists all active processes, and allows you to manage them.</p>

<p>Omarchy calls it Activity, and you start it by hitting <code>Super + Ctrl + T</code>. It opens as a floating window, which you can tile with <code>Super + T</code>.</p>

<h2 id="herdr"><a class="manual__heading-link" href="#herdr" aria-label="Link to this section">Herdr<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><a href="https://github.com/omacom-io/herdr">Herdr</a> is a terminal workspace manager that gives you workspaces, tabs, and panes, and keeps them all running in a persistent session you can detach from and come back to later.</p>

<p>You start it (or reattach to your existing session) with <code>Super + Ctrl + Return</code>. Omarchy ships a Herdr configuration that mirrors its Tmux config, so the prefix key is <code>Ctrl + Space</code> here too. You can browse all the keybindings with <code>Super + Ctrl + K</code>.</p>

<h2 id="fastfetch"><a class="manual__heading-link" href="#fastfetch" aria-label="Link to this section">Fastfetch<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><a href="https://github.com/fastfetch-cli/fastfetch">Fastfetch</a> shows system information, like kernel version, uptime, theme, CPU, memory, and more. It’s a successor to the popular neofetch tool.</p>

<p>Omarchy has packaged this as <em>About</em> in the Omarchy menu (<code>Super + Space</code>).</p>

<h2 id="disk-usage"><a class="manual__heading-link" href="#disk-usage" aria-label="Link to this section">Disk Usage<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p>When the drive fills up and you have no idea what’s eating it, launch <em>Disk Usage</em> from the app launcher (<code>Super + Space</code>). It’s <a href="https://github.com/Byron/dua-cli">dua</a> in interactive mode pointed at the whole file system, so you can walk down into whatever directory is the culprit, sorted biggest first, and delete from right inside it.</p>

<h2 id="cliamp"><a class="manual__heading-link" href="#cliamp" aria-label="Link to this section">Cliamp<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p><a href="https://www.cliamp.stream/">Cliamp</a> is a retro terminal music player inspired by Winamp 2.x, complete with built-in radio stations for lo-fi beats. Launch it with <code>Super + Shift + Alt + M</code>, or from the Omarchy menu under <em>Apps</em>. Press <code>?</code> for the full keybinding list.</p>

<h2 id="what-about-wi-fi-and-bluetooth"><a class="manual__heading-link" href="#what-about-wi-fi-and-bluetooth" aria-label="Link to this section">What about Wi-Fi and Bluetooth?<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p>You won’t find TUIs for Wi-Fi and Bluetooth - those jobs belong to the Omarchy shell. Click the Wi-Fi icon in the top bar (or hit <code>Super + Ctrl + W</code>) to see networks and connect, and click the Bluetooth icon (or hit <code>Super + Ctrl + B</code>) to pair and connect devices. See <a href="/manual/networking/">networking</a> for the full story.</p>

<h2 id="adding-your-own"><a class="manual__heading-link" href="#adding-your-own" aria-label="Link to this section">Adding your own<span class="manual__hash" aria-hidden="true">#</span></a></h2>

<p>Any terminal program can get the full app treatment. Go to <em>Install &gt; TUI</em> in the Omarchy menu (<code>Super + Space</code>), give it a name, a launch command, a window style, and an icon, and it’ll show up in the app launcher like any other application. You can remove it again under <em>Remove &gt; TUI</em>.</p>
