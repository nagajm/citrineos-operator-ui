'use client';

import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { pageMargin } from '@lib/client/styles/page';
import {
  BookOpen,
  ChevronRight,
  Cpu,
  HelpCircle,
  Settings,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@lib/utils/cn';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
    {children}
  </code>
);

const Pre = ({ children }: { children: string }) => (
  <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all my-2">
    {children}
  </pre>
);

const Step = ({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-4 py-3 border-b border-border last:border-0">
    <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
      {n}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium mb-1">{title}</p>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  </div>
);

const Note = ({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warn';
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      'rounded-md px-4 py-3 text-sm my-3 border',
      type === 'warn'
        ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200'
        : 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-200',
    )}
  >
    {children}
  </div>
);

const Table = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) => (
  <div className="overflow-x-auto my-3">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-muted">
          {headers.map((h) => (
            <th key={h} className="text-left px-3 py-2 font-medium border border-border">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border">
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-2 border border-border align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const sections: Section[] = [
  {
    id: 'overview',
    icon: <BookOpen className="size-4" />,
    title: 'System Overview',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Zappo CSMS is an EV Charging Management System (Charge Station Management System) built
          on CitrineOS. It handles OCPP communication with chargers, billing, operator management,
          and driver sessions.
        </p>

        <h3 className="font-semibold text-base">Architecture</h3>
        <Table
          headers={['Component', 'URL / Port', 'Purpose']}
          rows={[
            ['Operator UI (this app)', 'https://app.zappoevcharging.com', 'Admin dashboard for managing chargers, operators, sessions'],
            ['OCPP Server (CitrineOS)', 'ws://65.0.157.6:8080', 'Chargers connect here via WebSocket (OCPP 1.6 / 2.x)'],
            ['Zappo API', 'http://65.0.157.6:3001', 'NestJS REST API for billing, operators, drivers'],
            ['Hasura GraphQL', 'http://65.0.157.6:8090', 'GraphQL layer over the PostgreSQL DB (accessed via /hasura/ proxy)'],
            ['PostgreSQL DB', 'Port 5432', 'Shared database for CitrineOS and Zappo API'],
          ]}
        />

        <h3 className="font-semibold text-base">User Roles</h3>
        <Table
          headers={['Role', 'App', 'Can Do']}
          rows={[
            ['Super Admin', 'Operator UI (this app)', 'See all stations, all transactions, manage operators and chargers'],
            ['Operator / Station Owner', 'Station Owner App', 'Manage their assigned stations, see their revenue'],
            ['Driver', 'Driver App (planned)', 'Find chargers, start/stop sessions, pay via wallet'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'charger-setup',
    icon: <Zap className="size-4" />,
    title: 'Charger Setup (Connecting a Charger)',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Chargers connect to Zappo CSMS via OCPP WebSocket. Currently EVerest (simulator) is
          connected as OCPP 2.1. Physical chargers can use OCPP 1.6 or 2.x.
        </p>

        <h3 className="font-semibold text-base">OCPP Connection Details</h3>
        <Table
          headers={['Setting', 'Value']}
          rows={[
            ['OCPP 1.6 WebSocket URL', 'ws://65.0.157.6:8080/1.6/<charger-id>'],
            ['OCPP 2.0.1 WebSocket URL', 'ws://65.0.157.6:8080/2.0.1/<charger-id>'],
            ['OCPP 2.1 WebSocket URL', 'ws://65.0.157.6:8080/2.1/<charger-id>'],
            ['<charger-id>', 'The unique station identifier (e.g. cp001, cp002). Must match the ocppConnectionName in the DB.'],
          ]}
        />

        <Note type="warn">
          The OCPP port (8080) is HTTP only — it is used for WebSocket upgrade. Chargers connect
          directly to the server IP, not through the HTTPS domain. Only the Operator UI is behind
          HTTPS/nginx.
        </Note>

        <h3 className="font-semibold text-base">Steps to Add a New Physical Charger</h3>
        <Step n={1} title="Register the charging station in the DB">
          <p>
            Go to <strong>Charging Stations</strong> → <strong>New</strong>. Enter the charger ID
            (e.g. <Code>cp002</Code>) as the <em>OCPP Connection Name</em>. This is what the
            charger uses in its WebSocket URL.
          </p>
        </Step>
        <Step n={2} title="Configure the charger's OCPP settings">
          <p>
            On the physical charger's configuration panel, set the CSMS URL to:
          </p>
          <Pre>{'ws://65.0.157.6:8080/2.0.1/cp002'}</Pre>
          <p>Replace <Code>2.0.1</Code> with the charger's OCPP version and <Code>cp002</Code> with your charger ID.</p>
        </Step>
        <Step n={3} title="Verify connection">
          <p>
            After the charger connects, the status column in <strong>Charging Stations</strong> will
            turn <strong>Online</strong> and show a green indicator.
          </p>
        </Step>
        <Step n={4} title="Assign to an operator">
          <p>
            Go to <strong>Operators</strong>, find the operator, and click <strong>Assign
            Station</strong> to link the charger to a station owner.
          </p>
        </Step>
      </div>
    ),
  },
  {
    id: 'charger-config',
    icon: <Settings className="size-4" />,
    title: 'Charger Configuration (OCPP Variables)',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          OCPP variables control charger behavior — meter sampling rate, max current, heartbeat
          interval, etc. Use the <strong>Configuration</strong> tab on any charging station detail
          page to read and set these.
        </p>

        <h3 className="font-semibold text-base">How to Set MeterValueSampleInterval</h3>
        <p className="text-sm text-muted-foreground">
          This controls how often the charger sends energy readings (in seconds). Default is 120s
          (2 minutes). Setting it to 60s gives 1-minute updates in the driver app.
        </p>

        <Step n={1} title='Open charging station → Commands → "Get Base Report"'>
          <p>
            Select <strong>Report Base: FullInventory</strong> and submit. This makes the charger
            send all its supported variables to the CSMS. Wait ~10 seconds.
          </p>
        </Step>
        <Step n={2} title='Commands → "Set Variables"'>
          <p>Fill in:</p>
          <Table
            headers={['Field', 'Value']}
            rows={[
              ['Component', 'SampledDataCtrlr'],
              ['Variable', 'Interval'],
              ['Value', '60  (seconds — change as needed)'],
              ['Attribute Type', 'Actual'],
              ['EVSE', 'leave blank  (station-level, not per-port)'],
            ]}
          />
          <p>Click <strong>Set Variables</strong>. The charger responds and updates the value.</p>
        </Step>
        <Step n={3} title='Verify in the Configuration tab'>
          <p>
            Go to the station&apos;s <strong>Configuration</strong> tab, select{' '}
            <strong>OCPP 2.0.1</strong> from the version dropdown, and find{' '}
            <Code>SampledDataCtrlr</Code> / <Code>Interval</Code> in the table.
          </p>
        </Step>

        <Note>
          For OCPP 1.6 chargers, use <strong>Change Configuration</strong> (in Commands) with key{' '}
          <Code>MeterValueSampleInterval</Code> instead of Set Variables.
        </Note>

        <h3 className="font-semibold text-base mt-4">Other Useful OCPP Variables (OCPP 2.x)</h3>
        <Table
          headers={['Component', 'Variable', 'What it controls']}
          rows={[
            ['SampledDataCtrlr', 'Interval', 'Seconds between meter value reports during charging'],
            ['SampledDataCtrlr', 'TxStartedMeasurands', 'Which measurands to sample at transaction start'],
            ['SampledDataCtrlr', 'TxUpdatedMeasurands', 'Which measurands to sample during transaction'],
            ['ChargingStation', 'HeartbeatInterval', 'Seconds between heartbeats to CSMS'],
            ['ClockCtrlr', 'NtpSource', 'NTP server URL for charger time sync'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'operators',
    icon: <Users className="size-4" />,
    title: 'Managing Operators',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Operators (station owners / CPOs) own and manage one or more charging stations. They earn
          revenue per kWh charged. Zappo acts as the platform between operators and drivers.
        </p>

        <h3 className="font-semibold text-base">Create an Operator</h3>
        <Step n={1} title='Go to Operators → New Operator'>
          <p>Fill in name, email, phone, company and initial billing rate (₹ per kWh).</p>
        </Step>
        <Step n={2} title='Assign a station'>
          <p>
            On the Operators list, click <strong>Assign Station</strong> on the operator card, then
            select the charging station to assign.
          </p>
        </Step>
        <Step n={3} title='Operator logs in to the Station Owner App'>
          <p>
            The operator uses the Flutter Station Owner App to view their stations, revenue, and
            active sessions. They log in with the email and password set here.
          </p>
        </Step>

        <h3 className="font-semibold text-base mt-2">Billing Rate</h3>
        <p className="text-sm text-muted-foreground">
          Each operator has a <Code>costPerKwh</Code> rate. This is the amount charged to drivers
          per kWh consumed. When a session ends, the system debits the driver&apos;s wallet based
          on <Code>totalKwh × costPerKwh</Code>. Change the rate from the Edit Operator page —
          the history of rate changes is stored in <Code>price_history</Code>.
        </p>
      </div>
    ),
  },
  {
    id: 'sessions',
    icon: <Zap className="size-4" />,
    title: 'Sessions & Transactions',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          A <em>transaction</em> is the OCPP-level record of a charging session stored by
          CitrineOS. A <em>driver session</em> is the Zappo billing record that wraps it.
        </p>

        <h3 className="font-semibold text-base">Session Lifecycle</h3>
        <Step n={1} title='Driver starts session (app or Plug & Charge)'>
          <p>
            Zappo API sends <Code>RequestStartTransaction</Code> (OCPP 2.x) or{' '}
            <Code>RemoteStartTransaction</Code> (OCPP 1.6) to the charger via CitrineOS.
          </p>
        </Step>
        <Step n={2} title='Charger acknowledges and begins'>
          <p>
            CitrineOS creates a <Code>Transaction</Code> row. The charger sends periodic{' '}
            <Code>MeterValues</Code> (interval = <Code>SampledDataCtrlr.Interval</Code>).
          </p>
        </Step>
        <Step n={3} title='Driver stops session'>
          <p>
            Zappo API sends <Code>RequestStopTransaction</Code>. CitrineOS closes the Transaction.
            Zappo computes cost (<Code>totalKwh × rate</Code>) and debits the driver&apos;s wallet.
          </p>
        </Step>

        <Note type="warn">
          A driver must have a wallet balance above the operator&apos;s{' '}
          <Code>minStartBalance</Code> threshold to start a session. If the wallet runs out
          mid-session, the system debits what it can (floors at ₹0.00) and flags the shortfall.
        </Note>

        <h3 className="font-semibold text-base mt-2">Viewing Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Go to <strong>Transactions</strong> in the sidebar for a full list. Drill into a
          charging station and click the <strong>Transactions</strong> tab to see sessions for
          that station only.
        </p>
      </div>
    ),
  },
  {
    id: 'drivers',
    icon: <Users className="size-4" />,
    title: 'Drivers & Authorizations',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Drivers are registered via OTP on the Driver App. Each driver gets a wallet for prepaid
          charging. The <strong>Authorizations</strong> page shows all tokens (app drivers,
          vehicles for Plug & Charge, and plain RFID cards) the CSMS recognises.
        </p>

        <h3 className="font-semibold text-base">Authorization Token Types</h3>
        <Table
          headers={['Type', 'Shown as', 'Description']}
          rows={[
            ['driver', 'Driver name + phone', 'Registered app user — idToken is the driver UUID'],
            ['vehicle', 'Vehicle label → driver name', 'Car registered for Plug & Charge — idToken is the vehicle RFID/eMAID'],
            ['(unlinked)', 'Unlinked badge', 'Plain RFID card or manually created token with no driver account'],
          ]}
        />

        <h3 className="font-semibold text-base mt-2">Plug & Charge (PnC)</h3>
        <p className="text-sm text-muted-foreground">
          Drivers register a vehicle in the app. Zappo inserts the vehicle&apos;s eMAID into
          CitrineOS <Code>Authorizations</Code> with <Code>idTokenType = eMAID</Code>. When the
          car plugs in, the charger sends <Code>Authorize</Code> and CitrineOS checks the eMAID.
          Charging starts automatically if the driver has a sufficient wallet balance.
        </p>

        <Note>
          Plug & Charge is untested with a real car. The eMAID normalisation in Zappo may not
          byte-match the contract certificate the charger sends — validate against a real vehicle
          before relying on PnC in production.
        </Note>
      </div>
    ),
  },
  {
    id: 'troubleshooting',
    icon: <HelpCircle className="size-4" />,
    title: 'Troubleshooting',
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base">Operator UI shows "Error loading data"</h3>
        <p className="text-sm text-muted-foreground">
          Usually a Hasura metadata inconsistency. Run these checks from the server:
        </p>
        <Pre>{`# 1. Check for inconsistent Hasura metadata
curl -X POST http://65.0.157.6:8090/v1/metadata \\
  -H "Content-Type: application/json" \\
  -H "x-hasura-admin-secret: <SECRET>" \\
  -d '{"type":"get_inconsistent_metadata","args":{}}'

# 2. If inconsistencies found, drop them
curl -X POST http://65.0.157.6:8090/v1/metadata \\
  -H "Content-Type: application/json" \\
  -H "x-hasura-admin-secret: <SECRET>" \\
  -d '{"type":"drop_inconsistent_metadata","args":{}}'`}</Pre>

        <h3 className="font-semibold text-base mt-2">OCPP commands give "Network Error"</h3>
        <p className="text-sm text-muted-foreground">
          All OCPP commands (Get Base Report, Set Variables, etc.) route through{' '}
          <Code>https://app.zappoevcharging.com/citrine/</Code> which nginx proxies to CitrineOS on
          port 8080. If that proxy is down:
        </p>
        <Pre>{`# On the server, check nginx and CitrineOS
sudo nginx -t && sudo nginx -s reload
docker ps | grep citrine-1`}</Pre>

        <h3 className="font-semibold text-base mt-2">Charger shows "Available" but charging does not start</h3>
        <p className="text-sm text-muted-foreground">
          The driver&apos;s <Code>idToken</Code> may be missing from CitrineOS{' '}
          <Code>Authorizations</Code>. EVerest sends an <Code>Authorize</Code> request; if the
          token is unknown, the charger gets stuck at "Wait for Auth" while the app shows "Active".
          Ensure the driver completed OTP verification — that is when Zappo inserts the
          Authorizations row.
        </p>

        <h3 className="font-semibold text-base mt-2">Meter values not updating in driver app</h3>
        <p className="text-sm text-muted-foreground">
          The app polls every 15 seconds but values only change when the charger sends new meter
          readings. Set <Code>SampledDataCtrlr.Interval</Code> (see Charger Configuration section)
          to a shorter interval (e.g. 30s). The charger must be online and the session active for
          the command to take effect.
        </p>

        <h3 className="font-semibold text-base mt-2">Driver wallet shows ₹0.00 unexpectedly</h3>
        <p className="text-sm text-muted-foreground">
          Check if total debits exceed total credits for this driver. If they do, ₹0.00 is correct
          (the wallet floors at zero, not negative). The driver needs to top up. If credits exceed
          debits and the balance is still ₹0.00, there is a data issue — check the{' '}
          <Code>wallets</Code> and <Code>wallet_transactions</Code> tables.
        </p>

        <h3 className="font-semibold text-base mt-2">Server container reference</h3>
        <Table
          headers={['Container', 'Port', 'Restart command']}
          rows={[
            ['citrineos-core-citrine-1 (OCPP)', '8080–8083', 'docker compose up -d citrine'],
            ['citrineos-core-citrine-ui-1 (Operator UI)', '3000', 'docker compose up -d citrine-ui'],
            ['citrineos-core-graphql-engine-1 (Hasura)', '8090', 'docker compose up -d graphql-engine'],
            ['citrineos-core-ocpp-db-1 (PostgreSQL)', '5432', 'docker compose up -d ocpp-db'],
            ['ev-csms-api (Zappo API)', '3001', 'cd ~/ev-csms-api && docker compose up -d'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'ocpp-commands',
    icon: <Terminal className="size-4" />,
    title: 'OCPP Commands Reference',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Commands are sent to a charger from the station detail page → Commands button. The
          charger must be online. OCPP 2.x and 1.6 have different command names.
        </p>

        <h3 className="font-semibold text-base">Common Commands (OCPP 2.x)</h3>
        <Table
          headers={['Command', 'What it does']}
          rows={[
            ['Get Base Report', 'Requests charger to report all its components and variables. Run this before Set Variables to populate the dropdown.'],
            ['Set Variables', 'Sends new values for OCPP variables (e.g. MeterValueSampleInterval, HeartbeatInterval).'],
            ['Get Variables', 'Reads current variable values from the charger.'],
            ['Change Availability', 'Set charger or EVSE to Operative or Inoperative.'],
            ['Clear Cache', 'Clears the charger\'s local auth cache.'],
            ['Reset', 'Soft or Hard reset of the charger.'],
            ['Trigger Message', 'Forces the charger to send a specific message (e.g. StatusNotification).'],
            ['Unlock Connector', 'Unlocks a connector if the cable is stuck.'],
          ]}
        />

        <h3 className="font-semibold text-base mt-2">Common Commands (OCPP 1.6)</h3>
        <Table
          headers={['Command', 'What it does']}
          rows={[
            ['Change Configuration', 'Set a configuration key (e.g. MeterValueSampleInterval = 60).'],
            ['Get Configuration', 'Read current configuration keys.'],
            ['Clear Cache', 'Clears the charger\'s local auth cache.'],
            ['Reset', 'Soft or Hard reset.'],
            ['Remote Start Transaction', 'Start a charging session remotely.'],
            ['Remote Stop Transaction', 'Stop an active charging session.'],
          ]}
        />

        <h3 className="font-semibold text-base mt-2">CitrineOS REST API Pattern</h3>
        <p className="text-sm text-muted-foreground">
          All OCPP commands are dispatched via:
        </p>
        <Pre>{'POST /ocpp/{version}/{module}/{action}?identifier={ocppConnectionName}'}</Pre>
        <p className="text-sm text-muted-foreground">
          Example — send GetBaseReport to cp001 (OCPP 2.1):
        </p>
        <Pre>{'POST http://65.0.157.6:8080/ocpp/2.1/reporting/getBaseReport?identifier=cp001\nBody: {"requestId":1,"reportBase":"FullInventory"}'}</Pre>
      </div>
    ),
  },
  {
    id: 'infrastructure',
    icon: <Cpu className="size-4" />,
    title: 'Infrastructure & Deployment',
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base">Server</h3>
        <Table
          headers={['Item', 'Value']}
          rows={[
            ['Provider', 'AWS Lightsail'],
            ['IP', '65.0.157.6'],
            ['Region', 'ap-south-1 (Mumbai)'],
            ['SSH Key', 'LightsailDefaultKey-ap-south-1.pem'],
            ['Domain', 'app.zappoevcharging.com (HTTPS via Let\'s Encrypt)'],
          ]}
        />

        <h3 className="font-semibold text-base mt-2">GitHub Repositories</h3>
        <Table
          headers={['Repo', 'Branch', 'Purpose']}
          rows={[
            ['nagajm/citrineos-core', 'main', 'OCPP server (CitrineOS fork)'],
            ['nagajm/citrineos-operator-ui', 'main', 'This operator web UI (CitrineOS fork)'],
            ['nagajm/ev-csms-api', 'master', 'Zappo NestJS backend API'],
            ['nagajm/ev-station-owner-app', 'main', 'Flutter station owner app'],
          ]}
        />

        <h3 className="font-semibold text-base mt-2">Deploy Flow</h3>
        <p className="text-sm text-muted-foreground">
          Every push to the branch triggers CI (GitHub Actions): build Docker image → push to
          ghcr.io → SSH to server → <Code>docker compose pull && docker compose up -d</Code>.
        </p>

        <Note type="warn">
          Never run <Code>hasura metadata apply</Code> — it applies upstream metadata that
          references columns missing in our DB and breaks the operator UI. Never pull/merge from
          the upstream citrineos repos (same reason). Never set <Code>DB_SYNCHRONIZE=true</Code>{' '}
          on the server — TypeORM will drop CitrineOS columns and crash Hasura.
        </Note>

        <h3 className="font-semibold text-base mt-2">nginx Proxy Locations</h3>
        <Table
          headers={['Path', 'Proxies to', 'Used for']}
          rows={[
            ['/hasura/', 'localhost:8090', 'Hasura GraphQL (data queries)'],
            ['/citrine/', 'localhost:8080', 'CitrineOS REST API (OCPP commands)'],
            ['/', 'localhost:3000', 'Operator UI (Next.js)'],
          ]}
        />
      </div>
    ),
  },
];

export const HelpPage = () => {
  const [activeId, setActiveId] = useState('overview');

  const activeSection = sections.find((s) => s.id === activeId)!;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center gap-3">
        <HelpCircle className="size-6 text-primary" />
        <h2 className="text-2xl font-semibold">Help & Setup Guide</h2>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar TOC */}
        <Card className="w-64 shrink-0 sticky top-6">
          <CardContent className="p-2">
            <ul className="space-y-0.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
                      activeId === s.id
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span className="shrink-0">{s.icon}</span>
                    <span className="flex-1">{s.title}</span>
                    {activeId === s.id && <ChevronRight className="size-3 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-lg font-semibold">
              {activeSection.icon}
              {activeSection.title}
            </div>
          </CardHeader>
          <CardContent className="pt-4">{activeSection.content}</CardContent>
        </Card>
      </div>
    </div>
  );
};