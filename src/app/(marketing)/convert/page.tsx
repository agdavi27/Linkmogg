import { hostLabel } from "@/lib/config";
import { Converter } from "./converter";

export const metadata = {
  title: "Convert your Linktree",
  description: "Bring your Linktree links to Linkmogg in a minute, see them in every theme, then start a free trial.",
};

export default function ConvertPage() {
  return <Converter host={hostLabel()} />;
}
