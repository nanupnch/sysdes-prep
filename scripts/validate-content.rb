# Content checker: parses every YAML file, resolves review links against content/outline.yaml,
# checks question fields, each written module's predict and check, and coverage of the ★★★ blocks.
# A module counts as written once a "## x.y Title {#x.y}" heading for it exists in content/parts
# (Start here: start.md). Unwritten modules, and mocks whose module is unwritten, are exempt.
# Run from the repo root: LC_ALL=en_US.UTF-8 ruby -Eutf-8:utf-8 scripts/validate-content.rb

require "yaml"

root = ARGV[0] || "."
outline = YAML.load_file(File.join(root, "content/outline.yaml"))

order = []    # module ids in reading order
mods = {}     # id => outline entry, with its part
anchors = {}  # anchor => {tier:, part:}
outline["parts"].each do |p|
  p["modules"].each do |m|
    order << m["id"]
    mods[m["id"]] = m.merge("part" => p["id"].to_s)
    anchors[m["id"]] = { tier: nil, part: p["id"].to_s }
    (m["blocks"] || []).each do |b|
      anchors["#{m["id"]}##{b["slug"]}"] = { tier: b["tier"], part: p["id"].to_s }
    end
  end
end
pos = order.each_with_index.to_h
home = order.find { |id| mods[id]["page"] == "home" }

written = {}
Dir[File.join(root, "content/parts/*.md")].sort.each do |f|
  text = File.read(f)
  front = text[/\A---\n(.*?)\n---/m, 1].to_s
  written[home] = true if front =~ /^page:\s*"?home"?\s*$/
  text.scan(/^##\s+[\d.]+\s+.*\{#([\d.]+)\}\s*$/) { |(id)| written[id] = true if mods[id] }
end

errors = []
refs = Hash.new { |h, k| h[k] = { total: 0, outside: 0 } }
mod_of = ->(anchor) { anchor.split("#").first }

# ---------- questions ----------
SCORED = %w[recall explain decide estimate draw faded guided].freeze
TYPES = SCORED + %w[predict crux choice]
AREAS = %w[numbers classic llm].freeze
seen = {}
counts = Hash.new { |h, k| h[k] = Hash.new(0) }
checks = Hash.new { |h, k| h[k] = [] }
predicts = Hash.new(0)

Dir[File.join(root, "content/items/*.yaml")].sort.each do |f|
  doc = YAML.load_file(f)
  part = doc["part"].to_s
  (doc["items"] || []).each do |it|
    id = it["id"]
    errors << "#{f}: question without an id" and next unless id
    errors << "#{id}: defined twice" if seen[id]
    seen[id] = true
    t = it["type"]
    errors << "#{id}: unknown type #{t.inspect}" unless TYPES.include?(t)
    errors << "#{id}: no prompt" if it["prompt"].to_s.strip.empty?
    counts[File.basename(f, ".yaml")][t] += 1
    item_mod = it["module"] || (t == "choice" ? home : id.split("-").first)
    errors << "#{id}: its id doesn't start with a module in the outline" and next unless pos.key?(item_mod)

    if SCORED.include?(t)
      iu = it["idea_units"] || []
      errors << "#{id}: needs 2–5 idea units (has #{iu.size})" unless (2..5).cover?(iu.size)
      unless %w[faded guided].include?(t)
        errors << "#{id}: no misconception" if it["misconception"].to_s.strip.empty?
        errors << "#{id}: objective must be 1–9" unless (1..9).cover?(it["objective"])
      end
      errors << "#{id}: no review link" unless it["review"]
    end
    if t == "choice"
      ch = it["choices"] || []
      errors << "#{id}: needs 4 choices" unless ch.size == 4
      errors << "#{id}: answer index out of range" unless it["answer"].is_a?(Integer) && it["answer"].between?(0, ch.size - 1)
      errors << "#{id}: no why" if it["why"].to_s.strip.empty?
      errors << "#{id}: area must be one of #{AREAS.join(", ")}" unless AREAS.include?(it["area"])
    end
    errors << "#{id}: no answer" if %w[predict crux].include?(t) && it["answer"].to_s.strip.empty?
    predicts[item_mod] += 1 if t == "predict"
    checks[item_mod] << it if id =~ /-c\d+\z/

    [it["review"], *(it["also"] || [])].compact.each do |a|
      unless anchors.key?(a)
        errors << "#{id}: unknown review link #{a}"
        next
      end
      refs[a][:total] += 1
      refs[a][:outside] += 1 if mod_of.(a) != item_mod || it["spaced"]
    end
    if it["spaced"] && it["review"] && anchors[it["review"]]
      rm = mod_of.(it["review"])
      errors << "#{id}: spaced, but reviews #{rm}, which doesn't come before #{item_mod}" if pos[rm] >= pos[item_mod]
    end
  end
end

# ---------- each written module's practice, by its stage in the loop ----------
# Teaching modules (frame, classic, llm): a predict, then a check of 2–4 questions whose last one revisits
# an earlier teaching module, when there is one. Mixed checks (stage check): every question revisits.
# Worked designs, guided designs and mocks carry their own practice (self-explanations, steps, rubrics).
TEACHING = %w[frame classic llm].freeze
written.keys.sort_by { |id| pos[id] }.each do |mid|
  stage = mods[mid]["stage"]
  list = checks[mid].sort_by { |it| it["id"][/\d+\z/].to_i }
  if TEACHING.include?(stage)
    errors << "#{mid}: no predict question (#{mid}-p1)" if predicts[mid].zero?
    errors << "#{mid}: its check needs 2–4 questions (has #{list.size})" unless (2..4).cover?(list.size)
    earlier = order.take(pos[mid]).any? { |id| TEACHING.include?(mods[id]["stage"]) }
    if earlier && !(list.last && list.last["spaced"])
      errors << "#{mid}: its check's last question should come from an earlier module (spaced: true)"
    end
  elsif stage == "check"
    errors << "#{mid}: a mixed check needs 3–8 questions (has #{list.size})" unless (3..8).cover?(list.size)
    errors << "#{mid}: every mixed-check question should revisit an earlier module (spaced: true)" unless list.all? { |it| it["spaced"] }
  end
end

# ---------- mocks: structure always; review links once their module or appendix page is written ----------
appendix_mocks = {}
Dir[File.join(root, "content/parts/*.md")].each do |f|
  text = File.read(f)
  next unless text[/\A---\n(.*?)\n---/m, 1].to_s =~ /^page:\s*"?appendix"?\s*$/
  text.scan(/^\{\{\s*mock\s+([\w-]+)\s*\}\}\s*$/) { |(id)| appendix_mocks[id] = true }
end
pending = []
Dir[File.join(root, "content/mocks/*.yaml")].sort.each do |f|
  m = YAML.load_file(f)
  %w[prompt clarifications probes rubric model_outline].each { |k| errors << "#{f}: missing #{k}" unless m[k] }
  (m["probes"] || []).each { |p| errors << "#{f}: probe without a minute" unless p["at"].is_a?(Integer) }
  home_mod = mods.keys.find { |id| mods[id]["mock"] == m["id"] }
  unless (home_mod && written[home_mod]) || appendix_mocks[m["id"]]
    pending << "#{m["id"]} (#{home_mod ? "#{home_mod} not written yet" : "no module in the outline"})"
    next
  end
  (m["rubric"] || []).each do |r|
    [r["review"], *(r["also"] || [])].compact.each do |a|
      if anchors.key?(a)
        refs[a][:total] += 1
        refs[a][:outside] += 1
      else
        errors << "#{m["id"]} #{r["id"]}: unknown review link #{a}"
      end
    end
  end
  counts["mocks"]["rubric lines (#{m["id"]})"] = (m["rubric"] || []).size
end

# ---------- practice prompts (Appendix E) ----------
pf = File.join(root, "content/practice.yaml")
if File.exist?(pf)
  ids = {}
  (YAML.load_file(pf)["prompts"] || []).each_with_index do |pr, i|
    errors << "practice prompt #{i + 1}: id must be E1, E2, … (has #{pr["id"].inspect})" unless pr["id"].to_s =~ /\AE\d+\z/
    errors << "practice prompt #{pr["id"]}: defined twice" if ids[pr["id"]]
    ids[pr["id"]] = true
    errors << "practice prompt #{i + 1}: group must be classic or llm" unless %w[classic llm].include?(pr["group"])
    errors << "practice prompt #{i + 1}: needs a prompt, assumptions and a crux" if %w[prompt assume crux].any? { |k| pr[k].to_s.strip.empty? }
    errors << "practice prompt #{i + 1}: needs at least one review link" if (pr["review"] || []).empty?
    (pr["review"] || []).each { |a| errors << "practice prompt #{i + 1}: unknown review link #{a}" unless anchors.key?(a) }
  end
end

# ---------- report ----------
puts "Written modules: #{written.size} of #{order.size} (#{written.keys.sort_by { |id| pos[id] }.join(", ")})"
puts "Questions by file and type:"
counts.sort_by { |k, _| k.to_s }.each { |file, h| puts "  #{file}: " + h.map { |t, n| "#{t} #{n}" }.join(", ") }
scored = counts.reject { |k, _| k == "mocks" }.values.sum { |h| h.select { |t, _| SCORED.include?(t) }.values.sum }
puts "Scored questions: #{scored}, plus #{counts.values.sum { |h| h["choice"] }} in the pretest"
puts "Mocks not checked yet: #{pending.join("; ")}" unless pending.empty?

# Coverage counts teaching modules only: worked designs, guided designs, mocks and checks are the practice.
gaps = anchors.select { |a, v| v[:tier] == 3 && a.include?("#") && written[mod_of.(a)] && TEACHING.include?(mods[mod_of.(a)]["stage"]) }.keys.reject do |a|
  refs[a][:total] >= 2 && refs[a][:outside] >= 1
end
puts "★★★ blocks in written teaching modules not yet tested twice, once outside their module: #{gaps.size}"
gaps.each { |a| puts "  #{a}  (#{refs[a][:total]} tests, #{refs[a][:outside]} outside)" }

if errors.empty?
  puts "No errors."
else
  puts "#{errors.size} error(s):"
  errors.each { |e| puts "  - #{e}" }
  exit 1
end
