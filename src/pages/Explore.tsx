import { useState } from 'react';
import { statusOf } from '../domain/auction';
import { CATEGORIES, type Category } from '../domain/types';
import { listAuctions } from '../server/api';
import { AuctionCard, Loading, Notice } from '../ui/components';
import { useCurrentUser, useFocusHeading, useLive, useNow } from '../ui/hooks';
import { FeatureStrip, HeroCarousel, ItemsRow } from '../ui/Hero';

type Filter = 'disponibles' | 'en-curso' | 'esperando' | 'terminadas';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Explore() {
  const h1 = useFocusHeading<HTMLHeadingElement>();
  const now = useNow();
  const user = useCurrentUser();
  const { data, loading } = useLive(listAuctions, []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | ''>('');
  const [filter, setFilter] = useState<Filter>('disponibles');

  const endingSoon = (data ?? [])
    .filter((s) => statusOf(s.auction, now) === 'en-curso')
    .sort((a, b) => a.auction.endsAt! - b.auction.endsAt!)
    .slice(0, 10);

  const items = (data ?? [])
    .map((s) => ({ s, status: statusOf(s.auction, now) }))
    .filter(({ s, status }) => {
      if (cat && s.auction.category !== cat) return false;
      if (q && !norm(s.auction.title + ' ' + s.auction.description).includes(norm(q))) return false;
      if (filter === 'disponibles') return status === 'en-curso' || status === 'esperando';
      if (filter === 'en-curso') return status === 'en-curso';
      if (filter === 'esperando') return status === 'esperando';
      return status === 'terminada';
    })
    .sort((x, y) => {
      // primero las que terminan pronto, luego las que esperan oferta (más nuevas primero)
      const rank = (st: string) => (st === 'en-curso' ? 0 : st === 'esperando' ? 1 : 2);
      const r = rank(x.status) - rank(y.status);
      if (r) return r;
      if (x.status === 'en-curso') return x.s.auction.endsAt! - y.s.auction.endsAt!;
      if (x.status === 'terminada') return y.s.auction.endsAt! - x.s.auction.endsAt!;
      return y.s.auction.createdAt - x.s.auction.createdAt;
    });

  return (
    <>
      <h1 ref={h1} tabIndex={-1} className="sr-only">
        Subasta Amiga: artículos en subasta
      </h1>
      {data && <HeroCarousel items={data} now={now} />}
      <FeatureStrip />
      {endingSoon.length > 0 && (
        <ItemsRow title="⏱ Terminan pronto">
          {endingSoon.map((s) => (
            <AuctionCard key={s.auction.id} summary={s} now={now} meId={user?.id} />
          ))}
        </ItemsRow>
      )}
      <h2 id="articulos" className="section-title">Todos los artículos</h2>
      <p className="lead">
        Elija un artículo para ver sus fotos y ofertar. Gana quien haga la oferta más alta cuando termine el tiempo.
      </p>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="buscar">Buscar</label>
          <input id="buscar" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Por ejemplo: hervidor" />
        </div>
        <div className="field">
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" value={cat} onChange={(e) => setCat(e.target.value as Category | '')}>
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="estado">Mostrar</label>
          <select id="estado" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="disponibles">Disponibles para ofertar</option>
            <option value="en-curso">Solo con cuenta regresiva</option>
            <option value="esperando">Solo esperando primera oferta</option>
            <option value="terminadas">Terminadas</option>
          </select>
        </div>
      </form>

      {loading && !data ? (
        <Loading />
      ) : items.length === 0 ? (
        <Notice kind="info" title="No encontramos artículos con esa búsqueda.">
          <p>Pruebe con otra palabra o elija «Todas las categorías».</p>
        </Notice>
      ) : (
        <>
          <p className="result-count" role="status">
            {items.length === 1 ? '1 artículo' : `${items.length} artículos`}
          </p>
          <ul className="grid">
            {items.map(({ s }) => (
              <AuctionCard key={s.auction.id} summary={s} now={now} meId={user?.id} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
