"use client";

export default function ErrorDashboard({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-semibold text-red-800">No se pudo cargar el dashboard</h1>
      <p className="mt-2 text-sm text-red-600">{error.message}</p>
    </div>
  );
}
