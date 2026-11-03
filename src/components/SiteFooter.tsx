export const SiteFooter = (): JSX.Element => (
  <footer className="py-4 text-center text-xs text-muted-foreground">
    Built by{" "}
    <a
      href="https://stepthrough.au/"
      target="_blank"
      rel="noopener"
      className="underline hover:text-foreground"
    >
      Stepthrough
    </a>{" "}
    ·{" "}
    <a
      href="mailto:contact@stepthrough.au"
      className="underline hover:text-foreground"
    >
      contact@stepthrough.au
    </a>
  </footer>
);

export default SiteFooter;
