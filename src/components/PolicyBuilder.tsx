import { useState } from 'react';
import { Plus, Trash2, Check, FileText, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { usePolicies } from "../context/PolicyContext";

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface Policy {
  id: string;
  name: string;
  rules: Rule[];
  requireFirstName: boolean;
  requireLastName: boolean;
  createdAt: string;
}

export function PolicyBuilder() {
  /*const [policies, setPolicies] = useState<Policy[]>([
    {
      id: '1',
      name: 'MiCA Compliance Policy',
      rules: [
        { id: 'r1', field: 'Age', operator: '≥', value: '18', logic: 'AND' },
        { id: 'r2', field: 'Country', operator: '=', value: 'EU Member State' },
      ],
      requireFirstName: true,
      requireLastName: true,
      createdAt: new Date().toISOString(),
    },
  ]);*/
  const { policies, setPolicies } = usePolicies();
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<{
    name: string;
    rules: Rule[];
    requireFirstName: boolean;
    requireLastName: boolean;
  }>({
    name: '',
    rules: [],
    requireFirstName: false,
    requireLastName: false,
  });

  const fields = ['Age', 'Country'];
  const operators = ['=', '≥'];

  const addRule = () => {
    const newRule: Rule = {
      id: Date.now().toString(),
      field: 'Age',
      operator: '≥',
      value: '',
      logic: currentPolicy.rules.length > 0 ? 'AND' : undefined,
    };
    setCurrentPolicy({
      ...currentPolicy,
      rules: [...currentPolicy.rules, newRule],
    });
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setCurrentPolicy({
      ...currentPolicy,
      rules: currentPolicy.rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      ),
    });
  };

  const removeRule = (id: string) => {
    setCurrentPolicy({
      ...currentPolicy,
      rules: currentPolicy.rules.filter((rule) => rule.id !== id),
    });
  };

  const savePolicy = () => {
    if (!currentPolicy.name.trim()) {
      toast.error('Please enter a policy name');
      return;
    }
    if (currentPolicy.rules.length === 0) {
      toast.error('Please add at least one rule');
      return;
    }
    if (currentPolicy.rules.some((r) => !r.value.trim())) {
      toast.error('Please fill in all rule values');
      return;
    }

    const newPolicy: Policy = {
      id: Date.now().toString(),
      ...currentPolicy,
      createdAt: new Date().toISOString(),
    };

    setPolicies([...policies, newPolicy]);
    setIsCreating(false);
    setCurrentPolicy({
      name: '',
      rules: [],
      requireFirstName: false,
      requireLastName: false,
    });
    setShowSuccess(true);
    toast.success('Policy created and credential issued!');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-2">Policy Builder</h2>
          <p className="text-slate-400">Create access rules for your permissioned domains</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Existing Policies */}
      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id} className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg text-slate-100 mb-1">{policy.name}</h3>
                <p className="text-sm text-slate-500">
                  Created {new Date(policy.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-teal-400 text-sm">
                <Check className="w-3 h-3" />
                Active
              </div>
            </div>

            <div className="space-y-2">
              {policy.rules.map((rule, index) => (
                <div key={rule.id} className="flex items-center gap-2 text-sm">
                  {index > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                      {rule.logic}
                    </span>
                  )}
                  <span className="text-slate-300">{rule.field}</span>
                  <span className="text-teal-400">{rule.operator}</span>
                  <span className="text-slate-100">{rule.value}</span>
                </div>
              ))}
            </div>

            {(policy.requireFirstName || policy.requireLastName) && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex gap-4">
                {policy.requireFirstName && (
                  <span className="text-xs text-slate-400">✓ First name required</span>
                )}
                {policy.requireLastName && (
                  <span className="text-xs text-slate-400">✓ Last name required</span>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Policy</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Policy Name */}
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input
                placeholder="e.g., MiCA Policy, FINMA Policy, Custom Policy"
                value={currentPolicy.name}
                onChange={(e) => setCurrentPolicy({ ...currentPolicy, name: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-slate-100"
              />
            </div>

            {/* Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Access Rules</Label>
                <Button
                  onClick={addRule}
                  size="sm"
                  variant="outline"
                  className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Rule
                </Button>
              </div>

              {currentPolicy.rules.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No rules yet. Add your first rule to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPolicy.rules.map((rule, index) => (
                    <div key={rule.id} className="flex items-center gap-3">
                      {index > 0 && (
                        <Select
                          value={rule.logic}
                          onValueChange={(value: 'AND', {/*| 'OR'*/}) => updateRule(rule.id, { logic: value })}
                        >
                          <SelectTrigger className="w-20 bg-slate-800/50 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="AND">AND</SelectItem>
                            {/*<SelectItem value="OR">OR</SelectItem>*/}
                          </SelectContent>
                        </Select>
                      )}

                      <Select value={rule.field} onValueChange={(value) => updateRule(rule.id, { field: value })}>
                        <SelectTrigger className="flex-1 bg-slate-800/50 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {fields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={rule.operator} onValueChange={(value) => updateRule(rule.id, { operator: value })}>
                        <SelectTrigger className="w-24 bg-slate-800/50 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {operators.map((op) => (
                            <SelectItem key={op} value={op}>
                              {op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Value"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        className="flex-1 bg-slate-800/50 border-slate-700"
                      />

                      <Button
                        onClick={() => removeRule(rule.id)}
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Flags */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <Label>Optional Requirements</Label>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <span className="text-slate-300 text-sm">Require first name</span>
                <Switch
                  checked={currentPolicy.requireFirstName}
                  onCheckedChange={(checked) =>
                    setCurrentPolicy({ ...currentPolicy, requireFirstName: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <span className="text-slate-300 text-sm">Require last name</span>
                <Switch
                  checked={currentPolicy.requireLastName}
                  onCheckedChange={(checked) =>
                    setCurrentPolicy({ ...currentPolicy, requireLastName: checked })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsCreating(false)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={savePolicy}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Policy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p>Policy created successfully!</p>
            <p className="text-sm text-teal-100">Verifiable credential issued to wallet</p>
          </div>
        </div>
      )}
    </div>
  );
}
