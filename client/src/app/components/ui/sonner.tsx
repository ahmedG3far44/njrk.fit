import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "#fff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e2e8f0",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
