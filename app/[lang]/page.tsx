import { redirect } from "next/navigation";

/** Idioma sin ruta: los enrutamientos del proxy llevan aquí. */
export default async function LanguageIndexPage(
  props: PageProps<"/[lang]">,
) {
  const { lang } = await props.params;

  redirect(`/${lang}/register`);
}
