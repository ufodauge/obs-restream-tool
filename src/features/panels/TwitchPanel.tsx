const hostname = URL.canParse(import.meta.url)
  ? URL.parse(import.meta.url)?.hostname
  : undefined;
if (hostname === undefined) {
  throw Error("unknown host name");
}

const SIZE_CLASSNAME_MAP = new Map([
  ["1", "col-span-4 row-span-4"],
  ["2", "col-span-8 row-span-8"],
]);

export const TwitchPanel = ({
  channel,
  size,
}: {
  channel: string;
  size: number;
}) => {
  const url =
    import.meta.env.DEV && import.meta.env.VITE_TWITCH_STUB
      ? import.meta.env.VITE_TWITCH_STUB
      : `https://player.twitch.tv/?channel=${channel}&parent=${hostname}&muted=true&width=100%&heigh=100%`;

  const className = `${SIZE_CLASSNAME_MAP.get(`${size}`) ?? "col-span-4 row-span-4"} rounded bg-base-300 shadow-xs`;

  return (
    <div className={className}>
      <iframe
        src={url}
        className="rounded"
        width="100%"
        height="100%"
      />
    </div>
  );
};
