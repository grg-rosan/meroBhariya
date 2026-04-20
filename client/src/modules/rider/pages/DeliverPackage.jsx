// src/rider/pages/DeliverPackage.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDeliverPackage } from '../hooks/useDeliverPackage';
import { GpsStatus } from '../components/deliver/GpsStatus';
import { DeliveryForm } from '../components/deliver/DeliveryForm';
import { ResultBanner } from '../components/deliver/ResultBanner';
import { SubmitButton } from '../components/deliver/SubmitButton';
export default function DeliverPackage() {
  const { id } = useParams();
  const { deliver, submitting, result, geofenceError, geo } = useDeliverPackage(id);

  const [codCollected, setCodCollected] = useState('');
  const [podNote, setPodNote]           = useState('');
  const [podFile, setPodFile]           = useState(null);

  const handleSubmit = () => deliver({ codCollected, podNote });

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Confirm delivery</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Your GPS will be verified before delivery is logged
        </p>
      </div>

      <GpsStatus loc={geo.loc} loading={geo.loading} />

      <DeliveryForm
        codCollected={codCollected}
        onCodChange={setCodCollected}
        podNote={podNote}
        onNoteChange={setPodNote}
        podFile={podFile}
        onFileChange={setPodFile}
      />

      <ResultBanner result={result} geofenceError={geofenceError} />

      <SubmitButton
        submitting={submitting}
        disabled={submitting || result === 'success'}
        onClick={handleSubmit}
      />

      <p className="text-xs text-zinc-600 text-center mt-3">
        Your GPS coordinates are verified server-side using PostGIS
      </p>
    </div>
  );
}