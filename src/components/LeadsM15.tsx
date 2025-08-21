import React, { useEffect, useState } from 'react';
import ViewLeads from './viewleads';
import axios from 'axios';

export default function LeadsM15() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/leads?collection=m15leads')
      .then(res => setLeads(res.data.items || []))
      .catch(err => setError('Erro ao carregar leads'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando leads...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return <ViewLeads leads={leads} />;
}
