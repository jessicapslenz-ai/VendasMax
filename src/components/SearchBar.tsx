import { formatCurrency } from "@/lib/utils";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Package, Users, ShoppingCart } from 'lucide-react';
import { Input } from './ui/input';
import { useStore } from '../store/StoreContext';
import { useNavigate } from 'react-router-dom';

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-primary/20 text-primary font-bold rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { products, clients, orders } = useStore();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);
  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);
  
  const filteredOrders = orders.filter(o => {
    const client = clients.find(c => c.id === o.clientId);
    return o.id.toLowerCase().includes(query.toLowerCase()) || 
           (client && client.name.toLowerCase().includes(query.toLowerCase()));
  }).slice(0, 3);

  const hasResults = filteredProducts.length > 0 || filteredClients.length > 0 || filteredOrders.length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar produtos, clientes, pedidos..."
          className="w-full bg-background pl-8 shadow-none md:w-[300px] lg:w-[400px]"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md z-50 overflow-hidden">
          {!hasResults ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto py-2">
              {filteredProducts.length > 0 && (
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">Produtos</div>
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect('/produtos')}
                      className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">
                        <HighlightMatch text={product.name} query={query} />
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatCurrency(product.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredClients.length > 0 && (
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">Clientes</div>
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleSelect('/clientes')}
                      className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">
                        <HighlightMatch text={client.name} query={query} />
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px]">
                        <HighlightMatch text={client.email} query={query} />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {filteredOrders.length > 0 && (
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">Pedidos</div>
                  {filteredOrders.map(order => {
                    const client = clients.find(c => c.id === order.clientId);
                    const orderIdShort = order.id.slice(0, 8);
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelect('/pedidos')}
                        className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                      >
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">
                          Pedido #<HighlightMatch text={orderIdShort} query={query} />
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px]">
                          {client && <HighlightMatch text={client.name} query={query} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
