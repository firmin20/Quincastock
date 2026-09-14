import React, { useState, useEffect } from 'react';
import { Database, ArrowUpRight, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { cloudService } from '../services/cloudService';
import { Product, Movement } from '../types';

interface DataMigrationBannerProps {
  userId: string;
  onMigrationComplete: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DataMigrationBanner: React.FC<DataMigrationBannerProps> = ({
  userId,
  onMigrationComplete,
  onShowToast,
}) => {
  const [hasDataToMigrate, setHasDataToMigrate] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [localMovements, setLocalMovements] = useState<Movement[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const migratedKey = `quinca_migrated_${userId}`;
      if (localStorage.getItem(migratedKey) === 'true') {
        return;
      }

      const rawProducts = localStorage.getItem('quinca_products');
      const rawMovements = localStorage.getItem('quinca_movements');

      let prods: Product[] = [];
      let movs: Movement[] = [];

      if (rawProducts) {
        prods = JSON.parse(rawProducts);
      }
      if (rawMovements) {
        movs = JSON.parse(rawMovements);
      }

      if (prods.length > 0 || movs.length > 0) {
        setLocalProducts(prods);
        setLocalMovements(movs);
        setHasDataToMigrate(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, [userId]);

  if (!hasDataToMigrate || dismissed) {
    return null;
  }

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await cloudService.migrateLocalDataToCloud(
        userId,
        localProducts,
        localMovements
      );

      localStorage.setItem(`quinca_migrated_${userId}`, 'true');
      setHasDataToMigrate(false);
      onShowToast(
        `Migration réussie : ${result.productsImported} produit(s) et ${result.movementsImported} mouvement(s) importés dans votre compte Cloud !`,
        'success'
      );
      onMigrationComplete();
    } catch (err) {
      onShowToast('Erreur lors de la migration des données.', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(`quinca_migrated_${userId}`, 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg mb-6 border border-orange-400/30 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-white">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
              Données locales détectées sur cet appareil
            </h3>
            <p className="text-xs sm:text-sm text-orange-100 font-medium">
              Nous avons trouvé <strong>{localProducts.length} produit(s)</strong> et{' '}
              <strong>{localMovements.length} mouvement(s)</strong> enregistrés sur votre téléphone. Voulez-vous les sauvegarder dans votre compte Cloud ?
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {migrating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Importation...
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                Importer mes données dans le compte
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold text-xs transition-colors cursor-pointer min-h-[44px]"
            title="Ignorer"
          >
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
};
