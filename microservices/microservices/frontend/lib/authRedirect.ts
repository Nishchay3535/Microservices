/** After successful login, go straight to the right dashboard (avoids home-page race with persist). */
export function redirectAfterLogin(router: { replace: (href: string) => void }, role: string) {
  switch (role) {
    case "admin":
      router.replace("/admin");
      break;
    case "authority":
      router.replace("/authority");
      break;
    case "mentor":
      router.replace("/mentor");
      break;
    default:
      router.replace("/employee");
  }
}
