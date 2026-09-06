export const voiceLinks = (text: string) =>
  text.split(/(https?:\/\/[^\s]+|@[A-Za-z0-9_]+)/g).map((text) => ({
    text,
    href: text.startsWith("@")
      ? `https://x.com/${text.slice(1)}`
      : /^https?:\/\//.test(text)
        ? text
        : undefined,
  }));
