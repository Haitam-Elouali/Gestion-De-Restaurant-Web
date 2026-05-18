import fs from 'fs'

// Caisse: wrap in BrowserTabs
const caissePath = 'src/pages/Caisse.tsx'
let caisse = fs.readFileSync(caissePath, 'utf8')
if (!caisse.includes('<BrowserTabs')) {
  caisse = caisse.replace(
    `          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">`,
    `          <BrowserTabs
            tabs={[
              { id: 'paiement', label: 'Valider un paiement', icon: <Wallet size={16} /> },
              { id: 'historique', label: 'Historique des paiements', icon: <Receipt size={16} /> },
              { id: 'etat', label: "Consulter l'état de la caisse", icon: <DollarSign size={16} /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
          {activeTab === 'paiement' && (
            <motionless-dialog>`,
  )
  caisse = caisse.replace('motionless-dialog', 'div')
  caisse = caisse.replace(
    `            </div>

            <div className="space-y-6">
              <motionless-dialog className="bg-card rounded-2xl border border-card-light p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Etat de la caisse</h2>`,
    `            </div>
          )}

          {activeTab === 'etat' && (
            <motionless-dialog>
                <h2 className="text-2xl font-bold text-white mb-4">État de la caisse</h2>`,
  )
  caisse = caisse.replace('motionless-dialog', 'motionless-dialog') // noop
  fs.writeFileSync(caissePath, caisse)
}

console.log('patch-pages done')
