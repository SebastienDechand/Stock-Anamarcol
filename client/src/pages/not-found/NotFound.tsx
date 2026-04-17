import AccessDenied from "../../components/AccessDenied/AccessDenied";

export default function NotFound() {
  return (
    <AccessDenied
      title="Page non trouvée"
      message="La page que vous recherchez n'existe pas ou a été supprimée."
      icon="notfound"
    />
  );
}
