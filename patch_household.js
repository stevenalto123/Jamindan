const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Household.jsx', 'utf8');

// The disaster tip is currently outside the card.
const target = 
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px', marginTop: '4px' }}>
                {submitting ? t('addingLabel') : t('addMemberBtn')}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fdf9eb', border: '1px solid #faebcc', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>;

const replacement = 
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px', marginTop: '4px' }}>
                {submitting ? t('addingLabel') : t('addMemberBtn')}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fdf9eb', border: '1px solid #faebcc', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/pages/Household.jsx', code);
console.log('Fixed Disaster Tip position inside sticky card.');
