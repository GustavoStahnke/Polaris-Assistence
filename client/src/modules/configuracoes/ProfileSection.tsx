import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '@polaris/shared';
import { Save, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { errorMessage } from '../../lib/api';
import { useProfile, useUpdateProfile } from '../../lib/hooks/useProfile';
import { toast } from '../../stores/toastStore';

export function ProfileSection() {
  const profile = useProfile();
  const update = useUpdateProfile();
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', callName: '', city: '' },
  });

  useEffect(() => {
    if (profile.data) form.reset(profile.data);
  }, [profile.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success('Perfil salvo', 'A Polaris já sabe como chamar você.');
    } catch (error) {
      toast.error('Não foi possível salvar', errorMessage(error));
    }
  });

  return (
    <PolarisCard
      icon={UserRound}
      label="Configurações · Perfil"
      title="Quem é você"
      state={profile.isPending ? 'loading' : 'ready'}
    >
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Seu nome" error={form.formState.errors.name?.message}>
          {(id) => <Input id={id} placeholder="Ex.: Maria Silva" {...form.register('name')} />}
        </Field>
        <Field
          label="Como a Polaris te chama"
          hint="Apelido usado nas saudações. Se ficar vazio, ela usa seu primeiro nome."
          error={form.formState.errors.callName?.message}
        >
          {(id) => <Input id={id} placeholder="Ex.: Mari" {...form.register('callName')} />}
        </Field>
        <Field
          label="Sua cidade"
          hint="Usada como referência. A cidade do clima é escolhida na aba Integrações › Open-Meteo."
          className="md:col-span-2"
        >
          {(id) => <Input id={id} placeholder="Ex.: Porto Alegre" {...form.register('city')} />}
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" variant="primary" icon={Save} loading={update.isPending}>
            Salvar perfil
          </Button>
        </div>
      </form>
    </PolarisCard>
  );
}
