import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PersonalCheckoutPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/choose-plan"); }, []);
  return null;
}
