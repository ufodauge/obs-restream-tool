export const hostname = URL.canParse(import.meta.url)
  ? URL.parse(import.meta.url)?.hostname
  : undefined;
if (hostname === undefined) {
  throw Error("unknown host name");
}

export const TwitchPanel = ({ channel }: { channel: string }) => (
  <div className="col-span-4 row-span-4 rounded-[.3cqw] bg-base-300 shadow-xs">
    <iframe
      src={`https://player.twitch.tv/?channel=${channel}&parent=${hostname}&mute=true&width=100%&heigh=100%`}
      className="rounded-[.3cqw]"
      width="100%"
      height="100%"
    ></iframe>
  </div>
);
