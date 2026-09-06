---
{
  "title": "Unified Clipboard & History",
  "description": "Usually on Linux, you need Ctrl + Shift + C/V to copy’n’paste in the terminal and Ctrl + C/V to do it everywhere else. That’s hard to get used to for anyone who",
  "order": 7,
  "path": "/manual/unified-clipboard-history/",
  "format": "html"
}
---

<p>Usually on Linux, you need <code>Ctrl + Shift + C/V</code> to copy’n’paste in the terminal and <code>Ctrl + C/V</code> to do it everywhere else. That’s hard to get used to for anyone who hasn’t been born and bred on Linux! So too is the switch from super to ctrl, if you’re coming from the Mac.</p>

<p>Omarchy tackles both problems with unified clipboard hotkeys that work (almost) everywhere. They are:</p>

<table>
  <thead>
    <tr>
      <th>Hotkey</th>
      <th>Command</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Super + C</td>
      <td>Copy</td>
    </tr>
    <tr>
      <td>Super + X</td>
      <td>Cut</td>
    </tr>
    <tr>
      <td>Super + V</td>
      <td>Paste</td>
    </tr>
    <tr>
      <td>Super + Ctrl + V</td>
      <td>Clipboard history</td>
    </tr>
  </tbody>
</table>

<p><em>Note that most agent harnesses will use <code>Ctrl + V</code> for pasting images, but <code>Super + V</code> for pasting text.</em></p>

<h3 id="clipboard-history"><a class="manual__heading-link" href="#clipboard-history" aria-label="Link to this section">Clipboard history<span class="manual__hash" aria-hidden="true">#</span></a></h3>

<p>The clipboard history is provided by the Omarchy shell and works for both text and images. You trigger it by <code>Super + Ctrl + V</code>, select your entry with return, and then that’ll be placed on the clipboard ready to paste on <code>Super + V</code>.</p>

<p><img src="/manual/images/clipboard-history.webp" alt="clipboard-history" /></p>

<p>You can also search the history just by starting to type:</p>

<p><img src="/manual/images/clipboard-history-search.webp" alt="clipboard-history-search" /></p>
