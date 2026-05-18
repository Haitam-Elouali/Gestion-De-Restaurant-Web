import fs from 'fs'

const path = 'src/pages/Admin.tsx'
let s = fs.readFileSync(path, 'utf8')

s = s.replace(/\s*\{\/\* formulaires CRUD en modales \*\/\s*\{false && \([\s\S]*?\)\}\s*\{false && editingEmploye[\s\S]*?\)\}\s*/m, '\n')

s = s.replace(
  /onClick=\{\(\) => setShowCreateTableForm\(!showCreateTableForm\)\}/g,
  'onClick={() => setModalCreateTable(true)}',
)
s = s.replace(/setShowEditTableForm\(false\)/g, 'setModalEditTable(false)')
s = s.replace(/\{showCreateTableForm && \([\s\S]*?\)\}\s*\{showEditTableForm && editingTable[\s\S]*?\)\}\s*/m, '')
s = s.replace(
  /onClick=\{\(\) => handleDeleteEmploye\(emp\.id, emp\.role\)\}/g,
  'onClick={() => setModalDelete(emp)}',
)

if (!s.includes('</BrowserTabs>')) {
  s = s.replace(
    /(\s*\{activeTab === 'parametres'[\s\S]*?)\n(\s*\)\}\n)(\s*<\/div>\n\s*<\/motionless-dialog>\n\s*\)\n\}\n\nexport default Admin)/,
    '$1\n        </BrowserTabs>\n$3',
  )
}

const modals = `
        <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Créer un compte utilisateur" size="lg"
          footer={<><button type="button" onClick={() => setModalCreate(false)} className="px-4 py-2 rounded-lg bg-card-light text-white">Annuler</button><button type="submit" form="form-create-employe" className="px-4 py-2 rounded-lg bg-primary text-white">Enregistrer</button></>}>
          <form id="form-create-employe" onSubmit={handleCreateEmploye} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nom" value={newEmploye.nom} onChange={e => setNewEmploye({...newEmploye, nom: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
            <input type="text" placeholder="Prénom" value={newEmploye.prenom} onChange={e => setNewEmploye({...newEmploye, prenom: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
            <input type="email" placeholder="Email" value={newEmploye.email} onChange={e => setNewEmploye({...newEmploye, email: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
            <input type="tel" placeholder="Téléphone" value={newEmploye.telephone} onChange={e => setNewEmploye({...newEmploye, telephone: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
            <select value={newEmploye.role} onChange={e => setNewEmploye({...newEmploye, role: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white">
              <option value="serveur">Serveur</option><option value="caissier">Caissier</option><option value="manager">Manager</option><option value="admin">Administrateur</option>
            </select>
            <input type="number" placeholder="Salaire" value={newEmploye.salaire} onChange={e => setNewEmploye({...newEmploye, salaire: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" />
            <input type="text" placeholder="Nom d'utilisateur" value={newEmploye.username} onChange={e => setNewEmploye({...newEmploye, username: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
            <input type="password" placeholder="Mot de passe" value={newEmploye.password} onChange={e => setNewEmploye({...newEmploye, password: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
          </form>
        </Modal>

        <Modal open={modalEdit && !!editingEmploye} onClose={() => { setModalEdit(false); setEditingEmploye(null) }} title="Modifier un compte utilisateur" size="lg"
          footer={<><button type="button" onClick={() => { setModalEdit(false); setEditingEmploye(null) }} className="px-4 py-2 rounded-lg bg-card-light text-white">Annuler</button><button type="submit" form="form-edit-employe" className="px-4 py-2 rounded-lg bg-primary text-white">Enregistrer</button></>}>
          {editingEmploye && (
            <form id="form-edit-employe" onSubmit={handleUpdateEmploye} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Nom d'utilisateur" value={editingEmploye.username || ''} onChange={e => setEditingEmploye({...editingEmploye, username: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
              <select value={editingEmploye.role} onChange={e => setEditingEmploye({...editingEmploye, role: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white">
                <option value="serveur">Serveur</option><option value="caissier">Caissier</option><option value="manager">Manager</option><option value="admin">Administrateur</option>
              </select>
              <input type="text" placeholder="Nom" value={editingEmploye.nom} onChange={e => setEditingEmploye({...editingEmploye, nom: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
              <input type="text" placeholder="Prénom" value={editingEmploye.prenom} onChange={e => setEditingEmploye({...editingEmploye, prenom: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
              <input type="email" placeholder="Email" value={editingEmploye.email} onChange={e => setEditingEmploye({...editingEmploye, email: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
              <input type="tel" placeholder="Téléphone" value={editingEmploye.telephone} onChange={e => setEditingEmploye({...editingEmploye, telephone: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white" required />
              <input type="number" placeholder="Salaire mensuel" value={editingEmploye.salaire_mensuel} onChange={e => setEditingEmploye({...editingEmploye, salaire_mensuel: e.target.value})} className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white md:col-span-2" />
            </form>
          )}
        </Modal>

        <Modal open={!!modalDelete} onClose={() => setModalDelete(null)} title="Supprimer un compte utilisateur" size="sm"
          footer={<><button type="button" onClick={() => setModalDelete(null)} className="px-4 py-2 rounded-lg bg-card-light text-white">Annuler</button><button type="button" onClick={() => modalDelete && handleDeleteEmploye(modalDelete.id, modalDelete.role)} className="px-4 py-2 rounded-lg bg-red-500/80 text-white">Confirmer la suppression</button></>}>
          <p className="text-text-gray text-sm">Êtes-vous sûr de vouloir supprimer définitivement ce compte ? Cette action est irréversible.</p>
        </Modal>
`

if (!s.includes('<Modal open={modalCreate}')) {
  s = s.replace('export default Admin', modals + '\nexport default Admin')
}

fs.writeFileSync(path, s)
console.log('done', fs.readFileSync(path, 'utf8').includes('</BrowserTabs>'))
