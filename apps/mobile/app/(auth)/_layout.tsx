import { Stack } from "expo-router";

/** Sign-in, sign-up, email verification and password reset. Shown while nobody is signed in. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
