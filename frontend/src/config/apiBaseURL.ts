export default function apiBaseURL() {
  if (import.meta.env.PROD) {
    return "/";
  } else {
    const port = 8000;
    return `http://localhost:${port}/`;
  }
}
