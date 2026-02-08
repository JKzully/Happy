import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatKr } from "@/lib/format";
import {
  subscriptionKPIs,
  subscriptionsByProduct,
  monthlyRevenue,
} from "@/lib/data/mock-subscriptions";

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Áskrift"
        subtitle="Yfirlit yfir Shopify áskriftir"
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Virkir áskrifendur"
          value={subscriptionKPIs.active.value.toString()}
          trend={
            Math.round((subscriptionKPIs.active.change / (subscriptionKPIs.active.value - subscriptionKPIs.active.change)) * 100)
          }
          trendLabel={subscriptionKPIs.active.changeLabel}
        />
        <StatCard
          label="Nýjar áskriftir (feb)"
          value={subscriptionKPIs.newThisMonth.value.toString()}
          trend={subscriptionKPIs.newThisMonth.changePct}
        />
        <StatCard
          label="Uppsagnir"
          value={subscriptionKPIs.churn.value.toString()}
          trend={-subscriptionKPIs.churn.rate}
          trendLabel="churn rate"
        />
        <StatCard
          label="Meðaltal LTV"
          value={formatKr(subscriptionKPIs.avgLTV.value)}
          trendLabel={`~${subscriptionKPIs.avgLTV.months} man`}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-elevated/50">
              <TableHead>Vara</TableHead>
              <TableHead className="text-right">Virkir</TableHead>
              <TableHead className="text-right">Nýjar</TableHead>
              <TableHead className="text-right">Uppsagnir</TableHead>
              <TableHead className="text-right">Tekjur (feb)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptionsByProduct.map((row) => (
              <TableRow key={row.productId}>
                <TableCell className="font-semibold text-foreground">
                  {row.productName}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {row.active}
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  +{row.new}
                </TableCell>
                <TableCell className="text-right font-semibold text-danger">
                  {row.churned > 0 ? `-${row.churned}` : "0"}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatKr(row.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <div className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Mánaðarlegar tekjur
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mánuður</TableHead>
                <TableHead className="text-right">Virkir</TableHead>
                <TableHead className="text-right">Tekjur</TableHead>
                <TableHead className="text-right">Churn %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyRevenue.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium text-foreground">
                    {row.month}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {row.active}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {formatKr(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-text-dim">
                    {row.churnRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
