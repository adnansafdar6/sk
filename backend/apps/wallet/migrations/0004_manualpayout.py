from django.db import migrations, models
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0003_sitesetting"),
    ]

    operations = [
        migrations.CreateModel(
            name="ManualPayout",
            fields=[
                ("id",          models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("username",    models.CharField(help_text="Display name shown on landing page (will be masked).", max_length=100)),
                ("amount",      models.DecimalField(decimal_places=2, max_digits=12)),
                ("payout_date", models.DateTimeField(default=django.utils.timezone.now, help_text="Date/time shown on landing page.")),
                ("is_active",   models.BooleanField(default=True, help_text="Only active entries appear on the landing page.")),
                ("note",        models.CharField(blank=True, help_text="Internal admin note (never shown publicly).", max_length=255)),
                ("created_at",  models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-payout_date"], "verbose_name": "manual payout", "verbose_name_plural": "manual payouts"},
        ),
    ]
