import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-stone-900">List Your Funeral Home</h1>
        <p className="mt-3 text-stone-500 leading-relaxed">
          Join Eulogy to help families in your area find transparent pricing. Listing is free.
          Your prices will be displayed exactly as submitted.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <strong>Why list on Eulogy?</strong> Families are more likely to choose funeral homes that
        are upfront about pricing. Transparency builds trust.
      </div>

      <RegisterForm />
    </div>
  );
}
