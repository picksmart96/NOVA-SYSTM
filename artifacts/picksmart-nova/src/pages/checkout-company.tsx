import { useEffect } from "react";
import { useLocation } from "wouter";

export default function CompanyCheckoutPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/choose-plan"); }, []);
  return null;
}
