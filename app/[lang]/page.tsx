import { redirect } from "next/navigation";

/** Respaldo: el proxy redirige /es y /en directamente al registro. */
export default async function LanguageIndexPage(
  props: PageProps<"/[lang]">,
) {
  const { lang } = await props.params;

  redirect(`/${lang}/register`);
}
