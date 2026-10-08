import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../../api/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button as UIButton } from '../../components/ui/button';
import { RotateCcw } from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { WidgetLauncherButtonSettingsForm } from '../../components/WidgetLauncherButtonSettingsForm';
import type {
  AppSettings,
  GlobalWidgetLauncherButtonSettings,
  WidgetLauncherButtonSettings,
} from '@shared/types';

const localizedStringWithEnSchema = z.object({
  en: z.string().trim().min(1, 'English value is required'),
  de: z.string().optional(),
  fr: z.string().optional(),
  nl: z.string().optional(),
  es: z.string().optional(),
  it: z.string().optional(),
  ja: z.string().optional(),
  zh: z.string().optional(),
});

const localizedStringSchema = z.object({
  en: z.string(),
  de: z.string().optional(),
  fr: z.string().optional(),
  nl: z.string().optional(),
  es: z.string().optional(),
  it: z.string().optional(),
  ja: z.string().optional(),
  zh: z.string().optional(),
});

const buttonSettingsSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  buttonText: z.union([z.null(), localizedStringWithEnSchema]),
  buttonShape: z.enum(['round', 'rectangle']),
  buttonIcon: z.string().nullable(),
  buttonIconSize: z.number(),
  buttonIconStroke: z.number(),
  theme: z.enum(['auto', 'light', 'dark']),
  enableHoverScaleEffect: z.boolean(),
  tooltipEnabled: z.boolean(),
  tooltipText: z.union([z.null(), localizedStringSchema]),
  lightButtonColor: z.string(),
  lightTextColor: z.string(),
  lightButtonHoverColor: z.string(),
  lightTextHoverColor: z.string(),
  darkButtonColor: z.string(),
  darkTextColor: z.string(),
  darkButtonHoverColor: z.string(),
  darkTextHoverColor: z.string(),
});

type ButtonSettingsFormValues = z.infer<typeof buttonSettingsSchema>;

// Compile-time guard that the schema stays structurally identical to the shared interface.
const _typeCheck: ButtonSettingsFormValues = {} as GlobalWidgetLauncherButtonSettings;
const _typeCheckReverse: GlobalWidgetLauncherButtonSettings = {} as ButtonSettingsFormValues;
void _typeCheck;
void _typeCheckReverse;

const DEFAULT_BUTTON_SETTINGS: ButtonSettingsFormValues = {
  position: 'bottom-right',
  buttonText: null,
  buttonShape: 'round',
  buttonIcon: 'bug',
  buttonIconSize: 24,
  buttonIconStroke: 2,
  theme: 'auto',
  lightButtonColor: '#C8A84E',
  lightTextColor: '#0D0D0D',
  lightButtonHoverColor: '#A88A2E',
  lightTextHoverColor: '#0D0D0D',
  darkButtonColor: '#C8A84E',
  darkTextColor: '#0D0D0D',
  darkButtonHoverColor: '#E0CC8A',
  darkTextHoverColor: '#0D0D0D',
  enableHoverScaleEffect: true,
  tooltipEnabled: true,
  tooltipText: null,
};

export function Button() {
  return <WidgetLauncherButtonSettingsSection />;
}

function WidgetLauncherButtonSettingsSection() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data.settings as AppSettings;
    },
  });

  if (isLoading || !settings?.widgetLauncherButton) {
    return (
      <Card className="max-w-4xl">
        <CardContent className="py-12">
          <Spinner className="mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  return <ButtonSettingsForm initialValues={settings.widgetLauncherButton} />;
}

function ButtonSettingsForm({ initialValues }: { initialValues: ButtonSettingsFormValues }) {
  const queryClient = useQueryClient();
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ButtonSettingsFormValues>({
    resolver: zodResolver(buttonSettingsSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
  });

  const watched = watch();

  const mutation = useMutation({
    mutationFn: async (data: ButtonSettingsFormValues) => {
      const response = await api.put('/settings', { widgetLauncherButton: data });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      reset(variables);
      toast.success('Widget button settings saved successfully');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleFormChange = (partial: WidgetLauncherButtonSettings) => {
    for (const key of Object.keys(partial) as Array<keyof WidgetLauncherButtonSettings>) {
      const next = partial[key];
      if (next === undefined) continue;
      setValue(key as keyof ButtonSettingsFormValues, next as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  };

  const onValid = (data: ButtonSettingsFormValues) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(DEFAULT_BUTTON_SETTINGS);
  };

  const buttonTextError =
    errors.buttonText?.message ??
    (errors.buttonText as { en?: { message?: string } } | undefined)?.en?.message;

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Widget Button Settings</CardTitle>
        <CardDescription>
          Configure the appearance and behavior of the floating widget launcher button.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onValid)} noValidate>
        <CardContent className="space-y-4">
          <WidgetLauncherButtonSettingsForm
            value={watched}
            onChange={handleFormChange}
            buttonTextError={buttonTextError}
          />

          <div className="flex gap-2 pt-4 border-t">
            <UIButton type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </UIButton>
            <UIButton
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={mutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </UIButton>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
